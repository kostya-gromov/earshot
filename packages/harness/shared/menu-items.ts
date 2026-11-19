/**
 * The four items every menu button target is measured with (docs/patterns/menu-button.md, Every
 * measured page). The third is disabled, set through each component's own props.
 */
export const menuItems = [
  { name: 'Rename', isDisabled: false },
  { name: 'Duplicate', isDisabled: false },
  { name: 'Archive', isDisabled: true },
  { name: 'Delete', isDisabled: false },
] as const;

/**
 * What each item's own handler calls. The engine reads the line to know that an item was
 * activated; it is plain text, not a live region, so it never counts as an announcement.
 */
export function sayLastAction(name: string): void {
  const line = document.getElementById('last-action');
  if (line) line.textContent = `Last action: ${name}`;
}
