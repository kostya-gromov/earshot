import { expect, test, type Locator, type Page } from '@playwright/test';

// The header stays at the top so the menu is in reach mid-page (2026-11-18). What it
// costs is watched here: nothing that sticks or takes focus may end up under it.
const header = (page: Page) => page.getByRole('banner');

/** The header's lower edge, less a pixel: layout lands on fractions (69.94 under a 70 px bar). */
async function headerBottom(page: Page): Promise<number> {
  const box = await header(page).boundingBox();
  return box ? box.y + box.height - 1 : 0;
}

async function scrollTo(page: Page, target: Locator) {
  await target.evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await page.mouse.wheel(0, 400);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(400);
}

test('the header and its Menu button stay at the top while the page scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/patterns/input-with-chips/');
  await page.evaluate(() => window.scrollTo(0, 3000));
  await expect.poll(async () => (await header(page).boundingBox())?.y).toBe(0);
  await expect(header(page).getByRole('button', { name: 'Menu' })).toBeInViewport();
});

test('at 390 px too the header stays at the top', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/patterns/input-with-chips/');
  await page.evaluate(() => window.scrollTo(0, 4000));
  await expect.poll(async () => (await header(page).boundingBox())?.y).toBe(0);
});

test('on a short window the header scrolls away with the page', async ({ page }) => {
  // A phone turned sideways or a page zoomed in: the header would take a fifth of the height.
  await page.setViewportSize({ width: 900, height: 420 });
  await page.goto('/patterns/input-with-chips/');
  await page.evaluate(() => window.scrollTo(0, 3000));
  await expect.poll(async () => (await header(page).boundingBox())?.y).toBeLessThan(0);
});

test('a section reached from the menu starts below the header', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/patterns/input-with-chips/');
  await page.evaluate(() => window.scrollTo(0, 3000));
  await header(page).getByRole('button', { name: 'Menu' }).click();
  await page
    .getByRole('navigation', { name: 'Menu' })
    .getByRole('link', { name: 'The rules' })
    .click();
  const heading = page.locator('#evidence-title');
  await expect
    .poll(async () => (await heading.boundingBox())!.y)
    .toBeGreaterThanOrEqual(await headerBottom(page));
});

test('what sticks below the header is not covered by it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/patterns/input-with-chips/');
  const tabs = page.getByRole('tablist', { name: 'Rules' });
  await scrollTo(page, page.locator('#evidence-title'));
  expect((await tabs.boundingBox())!.y).toBeGreaterThanOrEqual(await headerBottom(page));
  await page.goto('/methodology/');
  // The list is what sticks; its nav runs the page's whole height beside the text.
  const contents = page.getByRole('navigation', { name: 'On this page' }).getByRole('list');
  await scrollTo(page, page.locator('#scenarios'));
  expect((await contents.boundingBox())!.y).toBeGreaterThanOrEqual(await headerBottom(page));
});

// WCAG 2.4.11 names sticky headers as what hides focus (F110); scroll-padding is the remedy (C43).
for (const path of ['/patterns/input-with-chips/', '/methodology/', '/']) {
  test(`going back with Shift+Tab on ${path}, focus is never under the header`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.getByRole('contentinfo').getByRole('link').last().focus();
    const hidden: string[] = [];
    for (let stop = 0; stop < 80; stop++) {
      await page.keyboard.press('Shift+Tab');
      const found = await page.evaluate(() => {
        const element = document.activeElement;
        const bar = document.querySelector('body header, [role="banner"]');
        if (!element || !bar || bar.contains(element) || element === document.body) return null;
        const box = element.getBoundingClientRect();
        if (box.width === 0 && box.height === 0) return null;
        const bottom = bar.getBoundingClientRect().bottom - 1;
        // Taller than the window below the header (a rule's panel): its top cannot be below it,
        // and it is hidden only when the header covers all of it, the bar 2.4.11 sets.
        const fits = box.height <= window.innerHeight - bottom;
        const under = fits ? box.top < bottom : box.bottom <= bottom;
        return under ? `${element.tagName} ${element.textContent?.trim().slice(0, 40)}` : '';
      });
      if (found) hidden.push(found);
    }
    expect(hidden).toEqual([]);
  });
}
