import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// The modal dialog, the fifth pattern. It was built and reviewed on a preview route and moved to
// the patterns on 2026-11-23, after the VoiceOver check
// (docs/a11y-checks/2026-11-23-dialog-voiceover.md).
test.beforeEach(async ({ page }) => {
  await page.goto('/patterns/dialog/');
});

test('the page is one of the patterns, and nothing is left at the preview address', async ({
  page,
}) => {
  await expect(page.getByText('Preview, not published.')).toHaveCount(0);
  const kicker = page
    .locator('main p')
    .filter({ hasText: /^Pattern/ })
    .first();
  await expect(kicker).toContainText('5 of 6');
  await page.goto('/patterns/');
  await expect(page.getByRole('main').locator('a[href="/patterns/dialog/"]').first()).toBeVisible();
  const old = await page.goto('/lab/patterns/dialog/');
  expect(old?.status()).toBe(404);
});

test('the six measured systems are the columns of the matrix', async ({ page }) => {
  const systems = page.getByRole('columnheader');
  await expect(systems).toHaveCount(6);
  for (const name of ['Atlassian', 'Chakra UI', 'Fluent 2', 'GitHub Primer', 'MUI', 'React Aria']) {
    await expect(systems.filter({ hasText: name })).toHaveCount(1);
  }
});

test('a recording is drawn as a dialog, in words from the file', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/patterns/dialog/#rule-open-focus');
  const panel = page.locator('[role="tabpanel"][id="rule-open-focus"]');
  await expect(panel).toContainText('Enter on the button');
  await expect(panel).toContainText(
    'The dialog “Edit profile” opens. The tree reports it as modal. Focus in the dialog: textbox “Name”.',
  );
  // Not the note about chips: a dialog's fields and buttons are no set.
  await expect(panel).not.toContainText('No set position');
});

test('a click on the page behind says where it was made and what it did', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/patterns/dialog/#rule-outside-inert');
  const panel = page.locator('[role="tabpanel"][id="rule-outside-inert"]');
  await expect(panel).toContainText('A click where “Notes” is, behind the dialog.');
  await expect(
    panel.getByText('where the click was made; its place in this drawing is schematic'),
  ).toBeVisible();
  // Fluent 2: the dialog closes and focus is on the document, said as a loss.
  await panel
    .getByRole('button', { name: /Fluent 2/ })
    .first()
    .click();
  await expect(panel).toContainText('The dialog closes. Focus lost to the page.');
  await expect(panel.getByText('focus lost to the page', { exact: true })).toBeVisible();
});

test('the one difference is shown as a difference, with what the tree says', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/patterns/dialog/#rule-modal');
  const panel = page.locator('[role="tabpanel"][id="rule-modal"]');
  await panel
    .getByRole('button', { name: /^Differs React Aria/ })
    .first()
    .click();
  await expect(panel).toContainText('is not reported as modal');
  // The drawing and the words say what the tree reports, not that the dialog is not modal.
  await expect(panel).toContainText('The tree does not report it as modal.');
});

test('"For design" holds the six approved requirements, each with its source', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Copy all 6 for Figma' })).toBeVisible();
  for (const title of [
    'The dialog has a visible title, and the title is its name',
    'A visible button closes the dialog',
    'The page behind is visibly dimmed',
    'Show focus inside the dialog, at 3:1',
    'Decide where focus goes when the dialog opens',
    'The close button is at least 24 by 24 px',
  ]) {
    // The title stands in a row with its level and number: found within the lens, not alone.
    await expect(page.getByText(title).first()).toBeVisible();
  }
  await expect(page.getByText('Not written yet for this pattern.')).toHaveCount(0);
});

test('the playground runs the reference: a real modal dialog, with what is said shown over it', async ({
  page,
}) => {
  const playground = page.locator('[data-dialog][data-ready="true"]').first();
  await playground.waitFor();
  const opener = playground.locator('[data-dialog-open]');
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toHaveCount(1);
  await expect(dialog.getByRole('textbox', { name: 'Name' })).toBeFocused();
  // The transcript is behind the backdrop and inert: its last line is shown again above it.
  const heard = page.locator('[popover]');
  await expect(heard).toBeVisible();
  await expect(heard).toContainText('Name, textbox');
  // It cannot take a click or focus, and it is not in the accessibility tree.
  expect(await heard.evaluate((el) => el.matches(':popover-open'))).toBe(true);
  await expect(page.getByRole('textbox', { name: 'Name' })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(heard).toContainText('Save, button');
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('textbox', { name: 'Name' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(heard).toBeHidden();
  await expect(page.getByText('3 of 3 tried')).toBeVisible();
  await expect(page.getByRole('log', { name: 'Transcript' }).first()).toContainText(
    'Edit profile, button',
  );
});

test('"Watch it" opens the dialog, goes round it once and closes it, slowly enough to follow', async ({
  page,
}) => {
  test.setTimeout(40_000);
  const playground = page.locator('[data-dialog][data-ready="true"]').first();
  await playground.waitFor();
  await page.getByRole('button', { name: 'Watch it' }).click();
  const dialog = page.locator('dialog[open]');
  const heard = page.locator('[popover]');
  await expect(dialog.getByRole('textbox', { name: 'Name' })).toBeFocused();
  await expect(heard).toContainText('Name, textbox');
  // Each rest is long enough to read: a second later the same line is still the last one.
  await page.waitForTimeout(1000);
  await expect(heard).toContainText('Name, textbox');
  // Tab, Tab, and the third on the last button: the reference's own handler wraps it.
  await expect(heard).toContainText('Cancel, button');
  await expect(heard).toContainText('Save, button');
  await expect(dialog.getByRole('button', { name: 'Save' })).toBeFocused();
  // Started with the pointer, it still shows focus on a button, as a key would
  // (2026-11-23: no ring on the buttons).
  await expect(dialog.getByRole('button', { name: 'Save' })).toHaveCSS('outline-style', 'solid');
  await expect(heard).toContainText('Name, textbox');
  await expect(dialog.getByRole('textbox', { name: 'Name' })).toBeFocused();
  // It does not stop with the dialog open: the page behind an open modal dialog is inert, and
  // nothing on it, the lenses below included, could be used.
  await expect(page.locator('dialog[open]')).toHaveCount(0, { timeout: 10_000 });
  await expect(playground.locator('[data-dialog-open]')).toBeFocused();
  await expect(playground.locator('[data-dialog-open]')).toHaveCSS('outline-style', 'solid');
  await page.getByRole('tab', { name: /For code/ }).click();
  await expect(page.getByRole('heading', { name: 'Behavior contract' })).toBeVisible();
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`has no axe violations in the ${colorScheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/patterns/dialog/');
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.timeline === document.timeline)
          .map((a) => a.finished.catch(() => undefined)),
      ),
    );
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
