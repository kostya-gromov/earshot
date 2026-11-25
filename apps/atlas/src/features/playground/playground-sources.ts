interface PlaygroundSource {
  /** Base name of the reference's markup, styles and module: `<entry>.html`, `.css`, `.js`. */
  entry: string;
  /** Where "You would hear" sits: under the field, or beside a field that opens a list. */
  layout: 'stacked' | 'beside';
}

/** Which reference files a pattern's playground loads; a pattern without an entry has none. */
export const playgroundSources: Readonly<Record<string, PlaygroundSource>> = {
  'input-with-chips': { entry: 'chip-field', layout: 'stacked' },
  combobox: { entry: 'combobox', layout: 'beside' },
  'menu-button': { entry: 'menu-button', layout: 'beside' },
  tabs: { entry: 'tabs', layout: 'stacked' },
  dialog: { entry: 'dialog', layout: 'stacked' },
  select: { entry: 'select', layout: 'beside' },
};
