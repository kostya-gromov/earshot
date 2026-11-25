import type { ComboboxMoment } from './combobox-replay';

/**
 * What the tree said about a select at one moment, in words: its value, or, where it gives none,
 * the description it carries, or that it was not in the tree at all. Only what was recorded: a
 * value last read is not carried into a step whose tree held no select (verdict audit,
 * 2026-11-24). The semantic model does not say descriptions, so these words do (Atlassian).
 */
export function selectStateWords(moment: ComboboxMoment): string {
  if (moment.isOutOfTree) return 'The select is not in the tree';
  if (moment.value !== undefined) return `Value “${moment.value}”`;
  if (moment.description) return `No value; described as “${moment.description}”`;
  return 'No value';
}

/**
 * The select's words after a step: a value only when it changed, and a select with no value, or
 * none in the tree, on every step, so an empty field is never left unexplained (design review,
 * 2026-11-24).
 */
export function selectChange(before: ComboboxMoment, after: ComboboxMoment): string[] {
  const now = selectStateWords(after);
  const hasValue = !after.isOutOfTree && after.value !== undefined;
  return hasValue && now === selectStateWords(before) ? [] : [`${now}.`];
}
