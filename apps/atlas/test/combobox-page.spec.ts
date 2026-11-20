import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// The combobox page. It was built and reviewed on a preview route, linked from nowhere, and moved
// to the patterns on 2026-11-15; the preview route is gone with the last pattern in progress.
const url = '/patterns/combobox/';

// The open rule; the lenses further down are tab panels too.
const rulePanel = (page: Page) => page.locator('[role="tabpanel"][id^="rule-"]:not([hidden])');

test('the page is listed on the home page and counts only the patterns that have a page', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('main').locator('a[href="/patterns/combobox/"]').first(),
  ).toBeVisible();
  await page.goto(url);
  await expect(page.getByText('Preview, not published.')).toHaveCount(0);
  // Only patterns that have a page are counted, and none is in progress now.
  const kicker = page
    .locator('main p')
    .filter({ hasText: /^Pattern/ })
    .first();
  await expect(kicker).toContainText('2 of 4');
  await expect(kicker).not.toContainText('in progress');
  await expect(page.getByRole('link', { name: 'Patterns', exact: true })).toHaveAttribute(
    'href',
    '/#patterns',
  );
  // Nothing is left behind at the old address.
  const old = await page.goto('/lab/patterns/combobox/');
  expect(old?.status()).toBe(404);
});

test('the matrix shows every rule against every measured system, all six counted', async ({
  page,
}) => {
  await page.goto(url);
  const matrix = page.getByRole('grid');
  await expect(matrix.getByRole('row')).toHaveCount(11);
  // Every system passed the inclusion test (ADR 0006, amendment of 2026-11-15): none is set apart.
  await expect(matrix).not.toContainText('Shown, not counted');
  await expect(matrix.getByRole('columnheader', { name: /Atlassian/ })).toBeVisible();
});

test('a compared system is replayed as the field with its list, and said in words', async ({
  page,
}) => {
  await page.goto(url);
  const reference = page
    .getByRole('article')
    .filter({ hasText: /^Reference/ })
    .first();
  // The schematic is hidden from assistive technology; every step's words are on the page.
  await expect(reference.locator('[aria-hidden="true"]').first()).toBeVisible();
  await expect(reference).toContainText('The list opens with 3 options.');
  await expect(reference).toContainText('“Apple” active, 1 of 3, and selected.');
});

test('a system that appends its messages is shown with the message of the step only', async ({
  page,
}) => {
  await page.goto(url);
  // Which systems are compared at first follows the verdicts; pick React Aria if it is not one.
  const choice = page.getByRole('group', { name: 'Compare with' }).getByRole('button', {
    name: 'React Aria',
  });
  if ((await choice.getAttribute('aria-pressed')) !== 'true') await choice.click();
  const reactAria = page
    .getByRole('article')
    .filter({ hasText: /^React Aria/ })
    .first();
  await expect(reactAria).toContainText('3 options available.');
  await expect(reactAria).not.toContainText('available.Apple');
});

test('a rule opens with its recording, its sources and its agreement', async ({ page }) => {
  await page.goto(`${url}#rule-selected`);
  const panel = rulePanel(page);
  await expect(
    panel.getByRole('heading', { name: 'The active option is the selected one' }),
  ).toBeVisible();
  await expect(panel).toContainText('1 of 6 judged systems follow');
  // A reviewed model that judged systems share is a second count, linked to the model's card.
  await expect(panel).toContainText('5 of 6 share one other model');
  const link = panel.getByRole('link', { name: 'one other model' });
  const target = (await link.getAttribute('href'))!.slice(1);
  await expect(page.locator(`[id="${target}"]`)).toHaveCount(1);
  // After the link the card is on screen with the heading of its block above it, not cut off.
  await link.click();
  const card = page.locator(`[id="${target}"]`);
  await expect(card).toBeInViewport();
  await expect(panel.getByRole('heading', { name: 'Why systems differ' })).toBeInViewport();
  await expect(panel).toContainText(
    'Different model: selected marks the chosen value, not the active option',
  );
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`the page has no axe violations in the ${colorScheme} theme`, async ({ page }) => {
    // Replays crossfade their words; contrast is judged on the settled page, not mid-fade.
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto(url);
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.timeline === document.timeline)
          .map((a) => a.finished.catch(() => undefined)),
      ),
    );
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('the page does not scroll sideways on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('One Tab stop shows where focus went, in the picture and in words', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('tab', { name: /One Tab stop/ }).click();
  const panel = rulePanel(page);
  // The reference: Tab reaches the next control of the page, named as the recording names it.
  await expect(panel).toContainText('Focus left the field: Note.');
  await panel.getByRole('button', { name: /Fluent 2/ }).click();
  // Fluent 2: Tab stops on a control of the combobox itself.
  await expect(panel).toContainText('Focus on button “Open Fruit”.');
});

test('the legend lists only the signs a recording uses', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('tab', { name: /One Tab stop/ }).click();
  const legend = rulePanel(page).getByRole('list', { name: 'Legend' });
  // Tab out of a closed field: no list is drawn and nothing is written to a live region.
  await expect(legend.getByRole('listitem')).toHaveText([/Said when focus lands$/]);
});

test('a system whose announcements depend on the platform says so beside its verdict', async ({
  page,
}) => {
  await page.goto(url);
  await page.getByRole('tab', { name: /Say that the suggestions changed/ }).click();
  const panel = rulePanel(page);
  await panel.getByRole('button', { name: /React Aria/ }).click();
  await expect(panel).toContainText('Measured on macOS.');
  await expect(panel).toContainText('only on Apple systems');
  // Every measured card names the operating system the run was made on.
  await expect(panel.getByRole('list', { name: 'Provenance' })).toContainText(
    /Chromium .* on macOS/,
  );
});

test('the design requirements are listed, each with its source', async ({ page }) => {
  await page.goto(url);
  const lens = page.getByRole('tabpanel', { name: /For design/ });
  const requirements = lens.getByRole('listitem').filter({ has: page.getByRole('heading') });
  await expect(requirements).toHaveCount(6);
  await expect(requirements.first()).toContainText('Draw the active option as focused');
  for (const requirement of await requirements.all()) {
    await expect(requirement.getByRole('link').first()).toHaveAttribute('href', /w3\.org\/WAI/);
  }
});

test('For code shows the reference source with notes, and the behavior contract', async ({
  page,
}) => {
  await page.goto(url);
  await page.getByRole('tab', { name: /For code/ }).click();
  const lens = page.getByRole('tabpanel', { name: /For code/ });
  // A note marks the lines it explains in the file it belongs to.
  await lens.getByRole('button', { name: /^Focus stays in the input/ }).click();
  await expect(lens).toContainText("input.setAttribute('aria-activedescendant', optionId(active))");
  const contract = lens.getByLabel('Behavior contract');
  await expect(contract).toContainText('type “a”');
  await expect(contract).toContainText('says “3 suggestions”');
});

test('on a phone the contract shows what each step led to without scrolling sideways', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await page.getByRole('tab', { name: /For code/ }).click();
  const contract = page.getByLabel('Behavior contract', { exact: true });
  await expect(contract).toContainText('active “Apple”, 1 of 3');
  const overflow = await contract.evaluate((pre) => pre.scrollWidth - pre.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('the notes column fades only at an edge that hides notes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  await page.getByRole('tab', { name: /For code/ }).click();
  const notes = page.getByRole('list', { name: 'Notes' });
  // At the top: more below, nothing above.
  await expect(notes).toHaveAttribute('data-more-below', 'true');
  await expect(notes).not.toHaveAttribute('data-more-above');
  await notes.evaluate((list) => list.scrollTo(0, list.scrollHeight));
  await expect(notes).toHaveAttribute('data-more-above', 'true');
  await expect(notes).not.toHaveAttribute('data-more-below');
});

// Design review 2026-11-15: on this page the section still described the chips pattern.
test('"Run it on your component" speaks about this pattern', async ({ page }) => {
  await page.goto(url);
  const section = page.getByRole('region', { name: 'Run it on your component' });
  await expect(section).toContainText(
    'Every scenario starts from one state: empty combobox focused, popup closed.',
  );
  await expect(section).not.toContainText('three values');
  await expect(section.getByLabel('Storybook story URL')).toHaveAttribute(
    'placeholder',
    /story\/combobox--for-earshot$/,
  );
});
