import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { pluginWindow } from '../src/lib/figma-plugin-window';

/*
 * The window of the plugin for Figma, outside Figma: the same document, with the page standing
 * in for the plugin that listens to it. What Figma does with the messages is not tested here.
 */
const patterns = [
  { id: 'input-with-chips', name: 'Input with chips', notes: 7 },
  { id: 'combobox', name: 'Combobox', notes: 1 },
];
const address = 'http://plugin.test/';

async function open(page: Page, hasAnnotations = true): Promise<() => Promise<unknown[]>> {
  await page.route(address, (route) =>
    route.fulfill({ contentType: 'text/html', body: pluginWindow(patterns, { hasAnnotations }) }),
  );
  await page.addInitScript(() => {
    const sent: unknown[] = [];
    Object.assign(window, { sent });
    window.addEventListener('message', (event: MessageEvent<{ pluginMessage: unknown }>) =>
      sent.push(event.data.pluginMessage),
    );
  });
  await page.goto(address);
  // The tests press keys at once: wait for the focus the window gives its first choice.
  await expect(page.getByRole('checkbox').first()).toBeFocused();
  return () => page.evaluate(() => (window as unknown as { sent: unknown[] }).sent);
}

test('names the patterns with their counts and starts on the first, chosen', async ({ page }) => {
  await open(page);
  const first = page.getByRole('checkbox', { name: 'Input with chips (7 requirements)' });
  await expect(first).toBeChecked();
  await expect(first).toBeFocused();
  await expect(page.getByRole('checkbox', { name: 'Combobox (1 requirement)' })).not.toBeChecked();
  await expect(page.getByRole('group', { name: 'Patterns' })).toBeVisible();
});

test('by keyboard alone: choose a second pattern and add both', async ({ page }) => {
  const sent = await open(page);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('checkbox', { name: /^Also add Figma annotations/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Add to this page' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Adding to the page.');
  await expect
    .poll(sent)
    .toContainEqual({ type: 'add', patterns: ['input-with-chips', 'combobox'], annotate: false });
});

test('Figma annotations are asked for only when their box is ticked', async ({ page }) => {
  const sent = await open(page);
  const box = page.getByRole('checkbox', { name: /^Also add Figma annotations/ });
  await expect(box).not.toBeChecked();
  await expect(box).toHaveAccessibleName(
    'Also add Figma annotations (needs a Full seat on a paid plan)',
  );
  await box.check();
  await page.getByRole('button', { name: 'Add to this page' }).click();
  await expect
    .poll(sent)
    .toContainEqual({ type: 'add', patterns: ['input-with-chips'], annotate: true });
});

test('a build without Figma annotations has no box for them and never asks', async ({ page }) => {
  const sent = await open(page, false);
  await expect(page.getByRole('checkbox', { name: /^Also add Figma annotations/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Add to this page' }).click();
  await expect
    .poll(sent)
    .toContainEqual({ type: 'add', patterns: ['input-with-chips'], annotate: false });
});

test('with nothing chosen it says what to do and adds nothing', async ({ page }) => {
  const sent = await open(page);
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Add to this page' }).click();
  await expect(page.getByRole('status')).toHaveText('Choose at least one pattern.');
  expect(await sent()).not.toContainEqual(expect.objectContaining({ type: 'add' }));
});

test('reports its height, and Escape asks the plugin to close', async ({ page }) => {
  const sent = await open(page);
  // The content's height, not the frame's: the page here is far taller than the window.
  const height = await page.evaluate(() => document.body.offsetHeight);
  expect(height).toBeLessThan(400);
  await expect.poll(sent).toContainEqual({ type: 'size', height });
  await page.keyboard.press('Escape');
  await expect.poll(sent).toContainEqual({ type: 'close' });
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`has no axe violations with Figma's ${colorScheme} colours`, async ({ page }) => {
    await open(page);
    // Stand-ins for the two variables the window reads; Figma's real values were not read.
    const [bg, text] = colorScheme === 'dark' ? ['#2c2c2c', '#ffffff'] : ['#ffffff', '#1e1e1e'];
    await page.addStyleTag({
      content: `:root { --figma-color-bg: ${bg}; --figma-color-text: ${text}; }`,
    });
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}
