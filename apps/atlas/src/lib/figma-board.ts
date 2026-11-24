import type { Pattern, Requirement } from '@earshot/contracts';
import { annotationHeading, sourceName } from './figma-annotation.ts';
import type { Pin, Pins } from './figma-board-pins.ts';

/*
 * A pattern's requirements as the notes of a board for Figma: plain data that the drawing script
 * turns into numbered pins on the element and a column of notes beside it. The notes are ordinary
 * layers, not Figma's own annotations: those could be neither written nor read on the free plan
 * (trial of 2026-11-21, docs/proposals/figma-annotated-elements.md). The words are the
 * requirement's own, so the file cannot say something the page does not.
 *
 * Relative imports keep their .ts extension here: scripts/figma-plugin.ts runs this module in
 * Node, which resolves no other kind.
 */

export interface BoardSource {
  name: string;
  url: string;
}

export interface BoardNote {
  number: number;
  title: string;
  reason: string;
  sources: BoardSource[];
  pin: Pin;
}

export interface BoardSpec {
  pattern: string;
  title: string;
  /** Where the requirements are on the site, so the file leads back to reasons and sources. */
  path: string;
  notes: BoardNote[];
}

function pinOf(requirement: Requirement, pins: Pins): Pin {
  const pin = pins[requirement.id];
  if (!pin) throw new Error(`Requirement "${requirement.id}" has no pin on the drawing.`);
  return pin;
}

/** A pin left behind by a requirement that is gone would point at nothing the page says. */
function assertEveryPinIsUsed(pattern: Pattern, pins: Pins): void {
  const ids = new Set(pattern.requirements.map((requirement) => requirement.id));
  const orphan = Object.keys(pins).find((id) => !ids.has(id));
  if (orphan) throw new Error(`Pin "${orphan}" has no requirement in ${pattern.id}.`);
}

/*
 * The plugin is in Figma's review as "Earshot Atlas", and the saved .fig was drawn under that
 * name; its notes keep it until the plugin is renamed (docs/follow-ups/figma-plugin.md).
 */
const pluginName = 'Atlas';

/** The board of a pattern: a numbered note per requirement, in the order of the page. */
export function boardSpec(pattern: Pattern, pins: Pins): BoardSpec {
  assertEveryPinIsUsed(pattern, pins);
  return {
    pattern: pattern.id,
    title: `Accessibility requirements for the design: ${pattern.name}`,
    path: `/patterns/${pattern.id}/#lens`,
    notes: pattern.requirements.map((requirement, index) => ({
      number: index + 1,
      title: annotationHeading(requirement, pluginName),
      reason: requirement.reason,
      sources: requirement.sources.map((source) => ({
        name: sourceName(source),
        url: source.url,
      })),
      pin: pinOf(requirement, pins),
    })),
  };
}
