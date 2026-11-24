import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const palette = (page: Page) => page.getByTestId('lab-palette');
const combobox = (page: Page) => page.getByRole('combobox', { name: 'Find a pattern' });
const trigger = (page: Page) => palette(page).getByRole('button', { name: /Find a pattern/ });

async function activeOptionName(page: Page): Promise<string | null> {
  const id = await combobox(page).getAttribute('aria-activedescendant');
  if (!id) return null;
  // The first span holding no other span: the name, without the aliases beside it.
  return page.locator(`[id="${id}"]`).locator('span:not(:has(span))').first().textContent();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/lab/');
});

test('Control+K opens it with focus in the combobox and the first pattern active', async ({
  page,
}) => {
  await page.keyboard.press('Control+k');
  await expect(combobox(page)).toBeFocused();
  await expect(combobox(page)).toHaveAttribute('aria-expanded', 'true');
  expect(await activeOptionName(page)).toBe('Input with chips');
  await expect(page.getByRole('status').filter({ hasText: 'patterns' })).toHaveText('5 patterns');
});

// Every pattern has a page since 2026-11-16, so none is skipped here; that arrows pass an option
// that cannot be chosen is tested on the model (test/unit/palette-model.test.ts).
test('arrows go through every pattern and wrap at both ends', async ({ page }) => {
  await trigger(page).click();
  await page.keyboard.press('ArrowDown');
  expect(await activeOptionName(page)).toBe('Combobox');
  await page.keyboard.press('ArrowDown');
  expect(await activeOptionName(page)).toBe('Menu button');
  await page.keyboard.press('ArrowDown');
  expect(await activeOptionName(page)).toBe('Tabs');
  await page.keyboard.press('ArrowDown');
  expect(await activeOptionName(page)).toBe('Modal dialog');
  await page.keyboard.press('ArrowDown');
  expect(await activeOptionName(page)).toBe('Input with chips');
  await page.keyboard.press('ArrowUp');
  expect(await activeOptionName(page)).toBe('Modal dialog');
  await expect(combobox(page)).toBeFocused();
});

test('“menu” finds the menu button, and Enter chooses it', async ({ page }) => {
  await trigger(page).click();
  await page.keyboard.type('menu');
  await expect(page.getByRole('option')).toHaveCount(1);
  await expect(page.locator('dialog[open]').getByRole('status')).toHaveText('1 pattern');
  await page.keyboard.press('Enter');
  await expect(palette(page).getByRole('status')).toHaveText('Chose Menu button');
});

test('typing filters by name and alias and reports the count', async ({ page }) => {
  await trigger(page).click();
  await page.keyboard.type('token');
  await expect(page.getByRole('option')).toHaveCount(1);
  await expect(page.getByRole('status').filter({ hasText: 'pattern' })).toHaveText('1 pattern');

  await page.keyboard.type('zzz');
  await expect(page.getByRole('option')).toHaveCount(0);
  await expect(combobox(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(combobox(page)).not.toHaveAttribute('aria-activedescendant');
  await expect(page.getByText('No pattern matches “tokenzzz”.')).toBeVisible();
});

test('Enter chooses the active pattern, closes and returns focus to the trigger', async ({
  page,
}) => {
  await trigger(page).focus();
  await page.keyboard.press('Enter');
  await expect(combobox(page)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(combobox(page)).toBeHidden();
  await expect(palette(page).getByRole('status')).toHaveText('Chose Input with chips');
  await expect(trigger(page)).toBeFocused();
});

test('Escape closes without choosing and clears the query for next time', async ({ page }) => {
  await trigger(page).click();
  await page.keyboard.type('chips');
  await page.keyboard.press('Escape');
  await expect(combobox(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await expect(palette(page).getByRole('status')).toHaveText('');

  await trigger(page).click();
  await expect(combobox(page)).toHaveValue('');
});

/*
 * The combobox rules the palette is held to (docs/patterns/combobox.md, "Earshot's own command
 * palette"). It is a combobox inside a modal dialog whose list is always shown, so it is checked
 * here, by rule id, and not measured as a combobox target: `tab`, `escape` and the closed
 * starting state of the scenarios describe a popup that opens and closes beside a field.
 */
test.describe('combobox rules', () => {
  const options = (page: Page) =>
    page.getByRole('listbox', { name: 'Patterns' }).getByRole('option');

  test('focus-stays: arrow keys leave DOM focus in the combobox, which names an option of its list', async ({
    page,
  }) => {
    await trigger(page).click();
    await page.keyboard.press('ArrowDown');
    await expect(combobox(page)).toBeFocused();
    const id = await combobox(page).getAttribute('aria-activedescendant');
    expect(id).not.toBeNull();
    const named = page.getByRole('listbox', { name: 'Patterns' }).locator(`[id="${id}"]`);
    await expect(named).toHaveAttribute('role', 'option');
    await expect(combobox(page)).toHaveAttribute(
      'aria-controls',
      (await page.getByRole('listbox', { name: 'Patterns' }).getAttribute('id'))!,
    );
  });

  test('selected: the active option, and no other, is exposed as selected', async ({ page }) => {
    await trigger(page).click();
    const id = await combobox(page).getAttribute('aria-activedescendant');
    const selected = options(page).and(page.locator('[aria-selected="true"]'));
    await expect(selected).toHaveCount(1);
    await expect(selected).toHaveAttribute('id', id!);
  });

  test('expanded: true while options are listed, false when the text matches nothing', async ({
    page,
  }) => {
    await trigger(page).click();
    await expect(options(page)).toHaveCount(5);
    await expect(combobox(page)).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.type('zzz');
    await expect(options(page)).toHaveCount(0);
    await expect(combobox(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('down: the first selectable option is active as soon as the list is shown or filtered', async ({
    page,
  }) => {
    await trigger(page).click();
    expect(await activeOptionName(page)).toBe('Input with chips');
    await page.keyboard.type('tag');
    expect(await activeOptionName(page)).toBe('Input with chips');
  });

  // Wrapping and longer lists are covered in test/unit/palette-model.test.ts.
  test('arrows: Down Arrow moves to the next selectable option and Up Arrow back', async ({
    page,
  }) => {
    await trigger(page).click();
    await page.keyboard.press('ArrowDown');
    expect(await activeOptionName(page)).toBe('Combobox');
    await page.keyboard.press('ArrowUp');
    expect(await activeOptionName(page)).toBe('Input with chips');
  });

  test('say-results and say-count: the status region is there before typing and then gives the count', async ({
    page,
  }) => {
    await trigger(page).click();
    const status = page.locator('dialog[open]').getByRole('status');
    // Written into a region that already exists, not inserted together with its text.
    await expect(status).toHaveText('5 patterns');
    await page.keyboard.type('token');
    await expect(status).toHaveText('1 pattern');
    await page.keyboard.type('zzz');
    await expect(status).toHaveText('No pattern matches “tokenzzz”.');
  });

  test('enter: Enter acts on the active option, the default action APG allows', async ({
    page,
  }) => {
    await trigger(page).click();
    await page.keyboard.press('Enter');
    await expect(palette(page).getByRole('status')).toHaveText('Chose Input with chips');
    await expect(combobox(page)).toBeHidden();
  });
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`has no axe violations while open in the ${colorScheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await trigger(page).click();
    await page.keyboard.type('i');
    const results = await new AxeBuilder({ page })
      .include('dialog[open]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
