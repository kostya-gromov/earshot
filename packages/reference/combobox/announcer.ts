/**
 * Speaks through a live region that exists from page load (screen readers often miss
 * regions inserted later). `region` is the element with role="status".
 */
export function createAnnouncer(region: HTMLElement): (text: string) => void {
  return (text) => {
    // Clear first so repeating the same message is still announced.
    region.textContent = '';
    requestAnimationFrame(() => {
      region.textContent = text;
    });
  };
}
