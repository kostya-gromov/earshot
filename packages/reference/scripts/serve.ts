/**
 * Minimal static server for the reference implementations. The engine (M1) starts the same
 * server to measure the reference, so it must stay boring. A request for `x.js` with no such
 * file serves `x.ts` with its types removed (see to-browser-js.ts).
 *
 *   node scripts/serve.ts                         # http://localhost:4173/input-with-chips/
 *   node scripts/serve.ts --port 4174 --root ../..  # serve another folder, e.g. design sketches
 */
import { createServer, type Server } from 'node:http';
import { parseArgs } from 'node:util';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { toBrowserJs } from './to-browser-js.ts';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));

const CONTENT_TYPES: Partial<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

interface Reply {
  status: number;
  headers: Record<string, string>;
  body?: string | Buffer;
}

const notFound: Reply = {
  status: 404,
  headers: { 'content-type': 'text/plain' },
  body: 'Not found',
};

export interface ServerOptions {
  port?: number;
  /** Folder to serve. Defaults to this package. */
  root?: string;
  /** Where `/` redirects. */
  home?: string;
}

/** Maps a URL path to a file inside `root`; null if it would escape it or reach node_modules. */
function toFilePath(urlPath: string, root: string): string | null {
  const decoded = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  const candidate = normalize(join(root, decoded));
  const isInside = candidate.startsWith(root) && !candidate.split(sep).includes('node_modules');

  return isInside ? candidate : null;
}

const isFile = (path: string) =>
  stat(path).then(
    (s) => s.isFile(),
    () => false,
  );
const ok = (body: string | Buffer, type: string): Reply => ({
  status: 200,
  headers: { 'content-type': type, 'cache-control': 'no-store' },
  body,
});

async function reply(url: string, { root, home }: Required<Omit<ServerOptions, 'port'>>) {
  const queryAt = url.indexOf('?');
  const urlPath = queryAt === -1 ? url : url.slice(0, queryAt);
  const query = queryAt === -1 ? '' : url.slice(queryAt);
  // A site whose home is the root itself (the Earshot export) serves its own index.html.
  if (urlPath === '/' && home !== '/') return { status: 302, headers: { location: home } };
  // Directory URLs need a trailing slash so relative links in index.html resolve.
  if (!extname(urlPath) && !urlPath.endsWith('/')) {
    return { status: 301, headers: { location: `${urlPath}/${query}` } };
  }

  const path = toFilePath(urlPath, root);
  if (!path) return notFound;
  return serveFile(path.endsWith(sep) || !extname(path) ? join(path, 'index.html') : path);
}

async function serveFile(file: string): Promise<Reply> {
  if (await isFile(file)) {
    return ok(await readFile(file), CONTENT_TYPES[extname(file)] ?? 'application/octet-stream');
  }
  // The browser asks for x.js; the source of truth is x.ts.
  const tsSource = file.replace(/\.js$/, '.ts');
  if (file.endsWith('.js') && (await isFile(tsSource))) {
    return ok(toBrowserJs(await readFile(tsSource, 'utf8'), tsSource), CONTENT_TYPES['.js']!);
  }
  return notFound;
}

/**
 * Text is gzipped when the browser accepts it, as any static host does. Lighthouse and the
 * transfer sizes it judges are only meaningful with compression on.
 */
function compress(reply: Reply, acceptEncoding: string | undefined): Reply {
  const isText = /^(text\/|application\/json|image\/svg)/.test(reply.headers['content-type'] ?? '');
  if (!reply.body || !isText || !acceptEncoding?.includes('gzip')) return reply;
  return {
    ...reply,
    headers: { ...reply.headers, 'content-encoding': 'gzip', vary: 'accept-encoding' },
    body: gzipSync(reply.body),
  };
}

export function startServer({
  port = 4173,
  root = packageRoot,
  home = '/input-with-chips/',
}: ServerOptions = {}): Promise<Server> {
  const options = { root: resolve(root) + sep, home };
  const server = createServer((req, res) => {
    reply(req.url ?? '/', options).then(
      (result) => {
        const { status, headers, body } = compress(result, req.headers['accept-encoding']);
        res.writeHead(status, headers).end(body);
      },
      (error: unknown) => {
        console.error(error);
        res.writeHead(500, { 'content-type': 'text/plain' }).end(String(error));
      },
    );
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

if (import.meta.main) {
  const { values } = parseArgs({
    options: { port: { type: 'string' }, root: { type: 'string' }, home: { type: 'string' } },
  });
  const port = Number(values.port ?? process.env.PORT ?? 4173);
  const home = values.home ?? '/input-with-chips/';
  await startServer({ port, home, ...(values.root ? { root: values.root } : {}) });
  console.log(`Serving at http://localhost:${port}${home}`);
}
