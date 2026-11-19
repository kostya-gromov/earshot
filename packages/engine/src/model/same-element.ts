import type { FocusInfo } from '@earshot/contracts';

/**
 * Whether two recorded moments of focus are on the same element. Read from the number the engine
 * gives each element, which does not change when the page around it does. The debug path is only
 * a fallback for recordings made before that number existed: a path changes when a sibling is
 * removed, which made a field that kept focus read as focus arriving on it again (verdict audit
 * 2026-11-16, Atlassian).
 */
export function isSameElement(before: FocusInfo, after: FocusInfo): boolean {
  if (before.element !== undefined && after.element !== undefined) {
    return before.element === after.element;
  }
  if (before.path !== undefined && after.path !== undefined) return before.path === after.path;
  return before.isBody === after.isBody && before.role === after.role && before.name === after.name;
}
