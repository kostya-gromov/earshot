/**
 * The tokens the lab page shows. Names mirror styles/tokens.css; the values live only in CSS, so
 * each swatch renders var(--name) and can never drift from what components use.
 */

export interface ColorToken {
  name: string;
  note: string;
}

export const meaningColors: readonly ColorToken[] = [
  { name: 'focus', note: 'Keyboard focus. Nothing else is blue.' },
  { name: 'heard', note: 'What a screen reader would say.' },
  { name: 'loss', note: 'Divergence or focus loss.' },
  { name: 'match', note: 'Matches the rule.' },
];

export const surfaceColors: readonly ColorToken[] = [
  { name: 'canvas', note: 'Page background' },
  { name: 'well', note: 'Sunken: evidence, code, forms' },
  { name: 'panel', note: 'Cards and rows' },
  { name: 'panel-2', note: 'Raised detail inside a panel' },
];

export const textColors: readonly ColorToken[] = [
  { name: 'ink', note: 'Primary text' },
  { name: 'ink-2', note: 'Secondary text' },
  { name: 'ink-3', note: 'Meta, labels' },
  { name: 'line-strong', note: 'Control borders (3:1)' },
];

export const typeScale: readonly string[] = [
  'display',
  'xl',
  'lg',
  'md',
  'base',
  'sm',
  'xs',
  '2xs',
];

export const speechScale: readonly string[] = ['speech-lg', 'speech-md', 'speech-sm'];

export const spaceScale: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const radii: readonly string[] = ['xs', 'sm', 'md', 'lg', 'xl'];

export const durations: readonly { name: string; use: string }[] = [
  { name: 'dur-micro', use: 'Hover, press, disclosure' },
  { name: 'dur-functional', use: 'Focus travel, chip leaving, rule lighting' },
  { name: 'dur-signature', use: 'The one scene per page' },
];
