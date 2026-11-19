import { expect, test, type Page } from '@playwright/test';

// A different model (one design that explains a system's verdicts on several rules): where it is
// said, what its link does, and how it shows in a rule's count.

const url = '/patterns/input-with-chips/';
const rulesTabs = (page: Page) => page.getByRole('tablist', { name: 'Rules' });

test('a different model is said on the React Aria verdicts it explains, and only there', async ({
  page,
}) => {
  await page.goto(url);
  for (const rule of ['tab', 'arrows', 'bsp']) {
    await expect(page.locator(`a[href="#ev-${rule}-react-aria"]`)).toHaveAccessibleName(
      /Explained by a different model/,
    );
  }
  // APG's grid asks for one stop itself, so chip-stop is a plain difference.
  await expect(page.locator('a[href="#ev-chip-stop-react-aria"]')).not.toHaveAccessibleName(
    /different model/,
  );
});

// Found 2026-11-13 by the owner: the model link is "#ev-<rule>-model-<systems>", and the player read
// everything after "ev-<rule>-" as a system. It chose a system that does not exist, so the
// recording disappeared and only the list of verdicts was left.
test('the link to a model’s trade-off keeps the recording and goes to the note', async ({
  page,
}) => {
  await page.goto(url);
  await rulesTabs(page).locator('#tab-arrows').click();
  const panel = page.locator('#rule-arrows');
  const systems = panel.getByRole('group', { name: 'Whose recording' });
  await systems.getByRole('button', { name: /Chakra UI/ }).click();
  await panel.getByRole('link', { name: 'What it gains and costs' }).click();
  await expect(systems.getByRole('button', { name: /Chakra UI/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(panel.getByRole('list', { name: 'Provenance' })).toBeVisible();
  await expect(page).toHaveURL(/#ev-arrows-model-chakra$/);
  await expect(page.locator('#ev-arrows-model-chakra')).toBeInViewport();
});

// Since 2026-11-13 the counted system with a model is Chakra UI (a highlight while focus stays in
// the input). React Aria's model is still shown, but the system is not counted. Both models were
// reviewed on 2026-11-15, so the count says them as a second line, linked to the model's card.
test('a count that includes a model-explained difference says how many share that model', async ({
  page,
}) => {
  await page.goto(url);
  await rulesTabs(page).locator('#tab-bsp').click();
  const rule = page.locator('#rule-bsp');
  await expect(rule).toContainText('1 of 4 judged systems follow');
  await expect(rule).toContainText('1 of 4 uses another model');
  // Only Chakra UI is counted among the systems its model names; React Aria's model adds no line.
  await expect(rule.getByRole('link', { name: 'another model' })).toHaveAttribute(
    'href',
    '#ev-bsp-model-chakra',
  );
  await expect(rule).toContainText(
    'Not counted: its own component for this pattern, TokenField, is not measured yet',
  );
  await expect(page.locator('#rule-chip-stop')).not.toContainText('one other model');
});
