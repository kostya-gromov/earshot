/**
 * APG tabs keyboard model (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): arrows move between
 * tabs and wrap, Home and End jump to the ends. Pure, so it is tested without rendering.
 *
 * Returns the index of the tab that should receive focus, or undefined when the key is not part
 * of the pattern and the browser should handle it.
 */
export function nextTabIndex(current: number, key: string, count: number): number | undefined {
  if (count === 0) return undefined;
  switch (key) {
    case 'ArrowRight':
      return (current + 1) % count;
    case 'ArrowLeft':
      return (current - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return undefined;
  }
}
