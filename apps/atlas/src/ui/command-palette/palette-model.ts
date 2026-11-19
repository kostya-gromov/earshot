/** One entry the palette can find. Pure data: the palette knows nothing about patterns. */
export interface PaletteItem {
  id: string;
  label: string;
  /** Other names the item is found by, for example "Tag input" for "Input with chips". */
  keywords?: readonly string[];
  description?: string;
  href: string;
  /** Listed but not selectable, for example a pattern that is not published yet. */
  isDisabled?: boolean;
  /** The kind of thing it is, as a title over the items of that kind: "Patterns", "Rules". */
  group?: string;
  /** Keys shown with the item, in Playwright notation: a rule is known by its keys. */
  keys?: readonly string[];
  /** Found by typing, not listed before anything is typed: there are too many of its kind. */
  isSearchOnly?: boolean;
}

const normalize = (value: string): string => value.trim().toLocaleLowerCase('en');

/**
 * Items whose label or keywords contain the query. An empty query lists everything that is not
 * for searching only.
 */
export function filterItems(items: readonly PaletteItem[], query: string): PaletteItem[] {
  const needle = normalize(query);
  if (needle === '') return items.filter(({ isSearchOnly }) => !isSearchOnly);
  return items.filter(({ label, keywords = [] }) =>
    [label, ...keywords].some((text) => normalize(text).includes(needle)),
  );
}

/** The first selectable item, which becomes active whenever the results change. */
export function firstEnabled(items: readonly PaletteItem[]): number | undefined {
  const index = items.findIndex(({ isDisabled }) => !isDisabled);
  return index === -1 ? undefined : index;
}

/**
 * APG combobox, list popup: Down and Up move the active option and wrap, skipping disabled
 * options. Returns undefined for keys the input itself should handle (caret, Home, End).
 */
export function moveActive(
  active: number | undefined,
  key: string,
  items: readonly PaletteItem[],
): number | undefined {
  const step = key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0;
  if (step === 0 || firstEnabled(items) === undefined) return undefined;
  const count = items.length;
  let index = active ?? (step === 1 ? -1 : count);
  for (let tried = 0; tried < count; tried += 1) {
    index = (index + step + count) % count;
    if (!items[index]?.isDisabled) return index;
  }
  return undefined;
}

export interface PaletteSection {
  title: string | undefined;
  entries: readonly { item: PaletteItem; index: number }[];
}

/**
 * The results as runs of one kind, each item with its place in the whole list: the arrow keys
 * move through one list, whatever titles stand in it.
 */
export function sectionsOf(results: readonly PaletteItem[]): PaletteSection[] {
  const sections: { title: string | undefined; entries: { item: PaletteItem; index: number }[] }[] =
    [];
  results.forEach((item, index) => {
    const last = sections.at(-1);
    if (last && last.title === item.group) last.entries.push({ item, index });
    else sections.push({ title: item.group, entries: [{ item, index }] });
  });
  return sections;
}
