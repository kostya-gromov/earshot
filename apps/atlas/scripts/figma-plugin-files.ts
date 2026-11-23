/// <reference types="node" />
/*
 * The three files of the Atlas plugin for Figma, as text: the script (the drawing code of
 * figma/ joined into one, with every drawn pattern's board from contracts written into it), the
 * window, and the manifest. The text is built in, so the plugin asks the network for nothing
 * (docs/proposals/figma-plugin.md, decision 2).
 */
import { stripTypeScriptTypes } from 'node:module';
import { patterns } from '@earshot/contracts';
import type { BoardSpec } from '../src/lib/figma-board.ts';
import { boardAnnotations } from '../src/lib/figma-board-annotations.ts';
import { boardPins } from '../src/lib/figma-board-pins.ts';
import { pluginWindow, type WindowOptions } from '../src/lib/figma-plugin-window.ts';
import { joinModules } from '../src/lib/sandbox-script.ts';
import { siteOrigin } from '../src/lib/site-origin.ts';
import { pluginSources, specOf } from './figma-drawing.ts';

export interface PluginFiles {
  code: string;
  window: string;
  manifest: string;
}

/** The boards of every pattern that has a drawing, in the order of the pins' list. */
export function boards(): BoardSpec[] {
  return Object.keys(boardPins).flatMap((id) => specOf(id) ?? []);
}

/* The id Figma assigned when the owner published from his personal account, 2026-11-22. A first
   submission from his work account (id 1706093283242416989) was unpublished. */
const manifest = {
  name: 'Earshot Atlas',
  id: '1706232314661494735',
  api: '1.0.0',
  main: 'code.js',
  ui: 'ui.html',
  editorType: ['figma'],
  documentAccess: 'dynamic-page',
  networkAccess: { allowedDomains: ['none'] },
};

/** `hasAnnotations`: whether the window offers Figma's own annotations (see the window). */
export function pluginFiles({ hasAnnotations }: WindowOptions): PluginFiles {
  const specs = boards();
  const sources = pluginSources().map((source) => stripTypeScriptTypes(source));
  const withAnnotations = specs.map((spec) => ({ spec, annotations: boardAnnotations(spec) }));
  const run = `runPlugin(${JSON.stringify(withAnnotations, null, 2)}, ${JSON.stringify(siteOrigin)});`;
  const choices = specs.map((spec) => ({
    id: spec.pattern,
    name: patterns[spec.pattern]?.name ?? spec.pattern,
    notes: spec.notes.length,
  }));
  return {
    code: `${joinModules(sources)}\n${run}\n`,
    window: pluginWindow(choices, { hasAnnotations }),
    manifest: `${JSON.stringify(manifest, null, 2)}\n`,
  };
}
