import { codeToHtml } from 'shiki';

const languageOf = (file: string) => {
  if (file.endsWith('.html')) return 'html';
  if (file.endsWith('.css')) return 'css';
  return 'ts';
};

/**
 * Code is coloured by syntax. Elsewhere on Atlas colour carries four fixed meanings (blue focus,
 * violet heard, red loss, green matches); inside a block of code it means syntax and nothing
 * else, which is what every reader of code expects there (apps/atlas/CLAUDE.md, Visual language,
 * exception decided by the owner on 2026-11-16). From 2026-11-13 to that day code was shown in three
 * greys instead, and read worse for it.
 *
 * github-light-default colours that fall under 4.5:1 on the code well or a marked line, swapped
 * for the next darker step of the same hue from Primer's scale (checked: 5.4:1 or more on both).
 * github-dark-default passes as it is (5.7:1 or more).
 */
const lightAtAA: Record<string, string> = {
  '#6e7781': '#57606a',
  '#cf222e': '#a40e26',
  '#8250df': '#6639ba',
};

/**
 * Build-time highlighting (CLAUDE.md 5: Shiki at build time, no client JS). Both themes are
 * emitted as CSS variables; the page picks one with light-dark().
 */
export async function highlightSource(file: string, source: string): Promise<string> {
  const html = await codeToHtml(source.replace(/\n$/, ''), {
    lang: languageOf(file),
    themes: { light: 'github-light-default', dark: 'github-dark-default' },
    defaultColor: false,
    colorReplacements: { 'github-light-default': lightAtAA },
  });
  // The tab panel around the code is the one scrollable, focusable region.
  return html.replace(' tabindex="0"', '');
}
