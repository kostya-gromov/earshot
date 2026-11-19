import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { toBrowserJs } from '../scripts/to-browser-js.ts';

const referenceDir = fileURLToPath(new URL('../input-with-chips/', import.meta.url));

describe('toBrowserJs', () => {
  it('removes types and rewrites .ts imports to .js', () => {
    const js = toBrowserJs(
      "import { a, type B } from './a.ts';\nexport const f = (x: B): number => a(x as never);\n",
      'f.ts',
    );
    expect(js).toMatch(/import \{ a \} from ["']\.\/a\.js["'];/);
    expect(js).toContain('export const f = (x) => a(x);');
  });

  it('turns every reference module into browser JS without TypeScript left in it', async () => {
    const files = (await readdir(referenceDir)).filter((f) => f.endsWith('.ts'));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const js = toBrowserJs(await readFile(referenceDir + file, 'utf8'), file);
      expect(js, file).not.toMatch(/from ["']\.\/[\w-]+\.ts["']/);
      expect(js, file).not.toMatch(/\binterface\s+\w+/);
    }
  });
});
