/**
 * The words the link preview image shows: the brand, the question and the line under it, read
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
  const lede = words(heading?.closest('section')?.querySelector('p'));
  return `${brand}. ${words(heading)} ${lede}`;
}
