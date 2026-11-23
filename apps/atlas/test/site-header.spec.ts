import { expect, test, type Page } from '@playwright/test';

test('the theme switch in the footer sets and remembers the theme', async ({ page }) => {
  await page.goto('/patterns/input-with-chips/');
  const group = page.getByRole('contentinfo').getByRole('group', { name: 'Theme' });
  await expect(group.getByRole('button', { name: 'Auto' })).toHaveAttribute('aria-pressed', 'true');

  await group.getByRole('button', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(group.getByRole('button', { name: 'Light' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await group.getByRole('button', { name: 'Auto' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
});

// Design review 2026-11-18: a setting chosen once took the header's room, most of it at 390 px.
test('the header holds no theme switch; the menu and the footer do, and agree', async ({
  page,
}) => {
  await page.goto('/patterns/input-with-chips/');
  const header = page.getByRole('banner');
  await expect(header.getByRole('button', { name: 'Light' })).toHaveCount(0);
  await header.getByRole('button', { name: 'Menu' }).click();
  const inMenu = page
    .getByRole('navigation', { name: 'Menu' })
    .getByRole('group', { name: 'Theme' });
  await inMenu.getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  // The menu stays open on a choice, so the change is seen where it was made.
  await expect(inMenu).toBeVisible();
  const inFooter = page.getByRole('contentinfo').getByRole('group', { name: 'Theme' });
  await expect(inFooter.getByRole('button', { name: 'Dark' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(inFooter.getByRole('button', { name: 'Auto' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

// Design review 2026-11-19: in the brand column it read as part of the statement, and on a
// phone it came before every link. Now it is the footer's last control.
test("the footer's theme switch comes after all its links", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const order = await page.getByRole('contentinfo').evaluate((footer) => {
    const controls = [...footer.querySelectorAll('a, button')];
    const firstButton = controls.findIndex((control) => control.tagName === 'BUTTON');
    const lastLink = controls.map((control) => control.tagName).lastIndexOf('A');
    return { firstButton, lastLink };
  });
  expect(order.firstButton).toBeGreaterThan(order.lastLink);
});

test('breadcrumbs mark the current page', async ({ page }) => {
  await page.goto('/patterns/input-with-chips/');
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs.getByRole('link', { name: 'Input with chips' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

// The stylesheets are linked; on a slow network the first frame comes before them.
for (const scheme of ['dark', 'light'] as const) {
  test(`before the stylesheet arrives the page is already ${scheme}`, async ({ page }) => {
    await page.route('**/*.css', (route) => route.abort());
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    const used = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
    expect(used).toBe('light dark');
    const pixel = await page.screenshot({ clip: { x: 700, y: 5, width: 1, height: 1 } });
    const { data } = await page.evaluate(
      async (bytes) => {
        const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)]));
        const canvas = new OffscreenCanvas(1, 1).getContext('2d')!;
        canvas.drawImage(bitmap, 0, 0);
        return { data: [...canvas.getImageData(0, 0, 1, 1).data] };
      },
      [...pixel],
    );
    const isDark = (data[0] ?? 255) < 64;
    expect(isDark).toBe(scheme === 'dark');
  });
}

// Every link is a full page load. The shortcut used to read "Ctrl K" until React hydrated and
// "⌘K" after, so on a Mac the search button changed width and jumped on every page.
test.describe('on a Mac', () => {
  test.use({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });

  async function searchBox(page: Page) {
    const search = page.getByRole('banner').getByRole('button', { name: 'Search' });
    // Both labels are in the page; what is drawn is what counts.
    await expect(search).toContainText('⌘K', { useInnerText: true });
    await expect(search).not.toContainText('Ctrl', { useInnerText: true });
    return search.boundingBox();
  }

  test('the search button is drawn as it will stay, before React hydrates', async ({
    page,
    context,
  }) => {
    await page.goto('/patterns/tabs/');
    await page.locator('[data-tabs][data-ready="true"]').first().waitFor();
    const hydrated = await searchBox(page);

    const before = await context.newPage();
    // Without the framework's scripts the page stays as the server wrote it.
    await before.route('**/_next/static/chunks/**/*.js', (route) => route.abort());
    await before.goto('/patterns/tabs/');
    expect(await searchBox(before)).toEqual(hydrated);
  });
});
