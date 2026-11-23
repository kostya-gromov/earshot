/// <reference types="node" />
/*
 * Records that public/figma/<pattern>.fig was saved from the board as it is drawn now:
 *
 *   node scripts/figma-file.ts input-with-chips
 *
 * Run it right after saving the file from Figma, and only then. The record is a statement by the
 * person who saved the file: nothing here can read a .fig. What it buys is the other direction:
 * when a requirement or the drawing changes later, test/unit/figma-files.test.ts goes red until
 * the file is drawn and saved again.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fingerprintOf, specOf } from './figma-drawing.ts';

const id = process.argv[2] ?? '';
const spec = specOf(id);
const root = join(import.meta.dirname, '..');
const file = `/figma/${id}.fig`;
if (!spec || !existsSync(join(root, 'public', file))) {
  console.error(`Nothing to record: "${id}" needs a drawing and a saved public${file}.`);
  process.exit(1);
}

const records = join(root, 'src', 'data', 'figma-files.json');
const known = JSON.parse(readFileSync(records, 'utf8')) as Record<string, unknown>;
const next = { ...known, [id]: { file, madeFrom: fingerprintOf(spec) } };
writeFileSync(records, `${JSON.stringify(next, null, 2)}\n`);
console.log(`Recorded ${file} in src/data/figma-files.json`);
