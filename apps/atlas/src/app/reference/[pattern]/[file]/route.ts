import { patterns, patternsInProgress } from '@earshot/contracts';
import { readReferenceFile, referenceFiles } from '@/data/reference';

// Static files at build time: the playground runs exactly this JavaScript, produced from the
// reference TypeScript by the same function the engine's server uses.
export const dynamic = 'force-static';

const contentTypes: Readonly<Record<string, string>> = {
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  html: 'text/html; charset=utf-8',
  // The source as written; served as text so no host mistakes .ts for a video stream.
  ts: 'text/plain; charset=utf-8',
};

export async function generateStaticParams() {
  const lists = await Promise.all(
    // A pattern in progress has a reference before it has a page; its files are served as well.
    Object.keys({ ...patterns, ...patternsInProgress }).map(async (pattern) =>
      (await referenceFiles(pattern)).map((file) => ({ pattern, file })),
    ),
  );
  return lists.flat();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pattern: string; file: string }> },
) {
  const { pattern, file } = await params;
  if (!(await referenceFiles(pattern)).includes(file))
    return new Response('Not found', { status: 404 });
  const type = contentTypes[file.split('.').at(-1) ?? ''] ?? 'text/plain; charset=utf-8';
  return new Response(await readReferenceFile(pattern, file), {
    headers: { 'content-type': type },
  });
}
