import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { toBrowserJs } from '@earshot/reference/to-browser-js';

const referenceRoot = path.join(process.cwd(), '..', '..', 'packages', 'reference');

/** Files the browser loads for a reference implementation; index.html is the engine's own page. */
const isServed = (name: string) => name !== 'index.html' && /\.(ts|css|html)$/.test(name);

/**
 * Published names: TypeScript sources are served as JavaScript with their types removed, and as
 * written, for "Copy file" on the code lens.
 */
export async function referenceFiles(patternId: string): Promise<string[]> {
  const names = (await readdir(path.join(referenceRoot, patternId))).filter(isServed);
  const built = names
    .filter((name) => name.endsWith('.ts'))
    .map((name) => name.replace(/\.ts$/, '.js'));
  return [...names, ...built];
}

/** The file as the browser receives it: .js is produced from .ts by the one shared stripper. */
export async function readReferenceFile(patternId: string, published: string): Promise<string> {
  const source = path.join(referenceRoot, patternId, published.replace(/\.js$/, '.ts'));
  const text = await readFile(source, 'utf8');
  return published.endsWith('.js') ? toBrowserJs(text, source) : text;
}

/** The source as written, for "For code" and the markup the playground mounts. */
export async function readReferenceSource(patternId: string, name: string): Promise<string> {
  return readFile(path.join(referenceRoot, patternId, name), 'utf8');
}
