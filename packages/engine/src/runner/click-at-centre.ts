import type { Locator, Page } from '@playwright/test';

/**
 * A mouse click at the centre of an element, whatever is drawn over it. `locator.click()` waits
 * until the element itself would receive the click, which a field behind a modal dialog's
 * backdrop never does; a person clicking there still clicks, and what happens is the question.
 */
export interface Point {
  x: number;
  y: number;
}

/** The centre of an element in whole CSS pixels: the point that is clicked and recorded. */
export async function centreOf(locator: Locator): Promise<Point> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('The click target has no box on the page.');
  return { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
}

export const clickAt = (page: Page, { x, y }: Point): Promise<void> => page.mouse.click(x, y);

/**
 * Whether `cover`'s own box lies over the centre of `target`. A click there is a click on the
 * cover: with an open dialog over the field, it would say nothing about the page behind (seen
 * on the reference page on 2026-11-21, docs/follow-ups/dialog.md). A backdrop is not the box.
 */
export async function coversCentre(cover: Locator, target: Locator): Promise<boolean> {
  const box = (await cover.isVisible()) ? await cover.boundingBox() : null;
  if (!box) return false;
  const { x, y } = await centreOf(target);
  return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
}
