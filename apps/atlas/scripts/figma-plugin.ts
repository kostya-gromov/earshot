/// <reference types="node" />
/*
 * Writes the Atlas plugin for Figma to figma/out/plugin/:
 *
 *   node scripts/figma-plugin.ts [--annotations]
 *
 * Then in Figma's desktop app: Plugins, Development, Import plugin from manifest, and choose
 * figma/out/plugin/manifest.json. The same plugin draws the board a .fig for the site is saved
 * from: run it in an empty file, "Save local copy", put the file in public/figma/<pattern>.fig
 * and record it with node scripts/figma-file.ts <pattern>.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pluginFiles } from './figma-plugin-files.ts';

const out = join(import.meta.dirname, '..', 'figma', 'out', 'plugin');
// The box for Figma's own annotations is left out unless asked for: nobody has seen that write
// succeed yet (docs/proposals/figma-plugin.md, step 5).
const files = pluginFiles({ hasAnnotations: process.argv.includes('--annotations') });
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'code.js'), files.code);
writeFileSync(join(out, 'ui.html'), files.window);
writeFileSync(join(out, 'manifest.json'), files.manifest);
console.log(`Wrote the plugin to ${out}`);
