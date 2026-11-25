/**
 * The words the link preview image shows: the brand, the question, the statement and the line under it, read
 * from the home page as it renders. scripts/og-image.ts writes them as the image's alt text
 * (app/opengraph-image.alt.txt), and a browser test reads them again from the built page, so a
 * picture that still shows an old name or an old question fails the build (2026-11-24: the
 * image said "Atlas" for a day after the rename).
 *
 * Runs in the page (page.evaluate), so it uses nothing from outside its own body.
 */
export function openingText(): string {
  const words = (element: Element | null | undefined): string =>
    (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const heading = document.querySelector('main h1');
  const brand = words(document.querySelector('header a[href="/"]'));
  // Since 2026-11-25 the opening is a line for who it is for, the statement and one line under
  // it, all three in one block around the heading.
  const [question, lede] = [...(heading?.parentElement?.querySelectorAll('p') ?? [])].map(words);
  return `${brand}. ${question ?? ''} ${words(heading)} ${lede ?? ''}`.replace(/\s+/g, ' ').trim();
}
