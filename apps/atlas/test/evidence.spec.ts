import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const url = '/patterns/input-with-chips/';
const ruleIds = ['chip-stop', 'chip-arrows', 'tab', 'arrows', 'bsp', 'keep-focus', 'say', 'count'];

const openRule = (page: Page, rule: string) =>
  page.getByRole('tablist', { name: 'Rules' }).locator(`#tab-${rule}`).click();

// Every rule's panel holds its own evidence, so each is checked when it is the one shown.
for (const colorScheme of ['light', 'dark'] as const) {
  test(`every rule's evidence has no axe violations in the ${colorScheme} theme`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto(url);
    for (const rule of ruleIds) {
      await openRule(page, rule);
      // The panel fades in (100 ms under reduced motion): contrast is judged once it has settled.
      await page
        .locator(`#rule-${rule}`)
        .evaluate((panel) =>
          Promise.all(
            panel.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined)),
          ),
        );
      const results = await new AxeBuilder({ page })
        .include(`#rule-${rule}`)
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze();
      expect(results.violations, `rule ${rule}`).toEqual([]);
    }
  });
}

const systemButton = (page: Page, rule: string, system: RegExp) =>
  page
    .locator(`#rule-${rule}`)
    .getByRole('group', { name: 'Whose recording' })
    .getByRole('button', { name: system });

// Since 2026-11-13 a link to a verdict brings the rule's player into view and puts focus on the
// chosen system's button, a real control, not on the block of notes under the recording.
test('a verdict in the matrix opens its rule, selects that system and focuses its button', async ({
  page,
}) => {
  await page.goto(url);
  await page.locator('a[href="#ev-bsp-react-aria"]').click();
  await expect(page.locator('#rule-bsp')).toBeVisible();
  const button = systemButton(page, 'bsp', /React Aria/);
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toBeFocused();
  await expect(page.locator('#player-bsp')).toBeInViewport();
  await expect(page).toHaveURL(/#ev-bsp-react-aria$/);
});

test('a link to a rule’s evidence opens that rule from the address alone', async ({ page }) => {
  await page.goto(`${url}#ev-say-mui`);
  await expect(page.locator('#rule-say')).toBeVisible();
  const button = systemButton(page, 'say', /MUI/);
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toBeFocused();
});

test('whose recording: one system at a time, and its scenarios say which decided', async ({
  page,
}) => {
  await page.goto(url);
  await openRule(page, 'tab');
  const panel = page.locator('#rule-tab');
  const whose = panel.getByRole('group', { name: 'Whose recording' });
  await whose.getByRole('button', { name: /^Differs Fluent 2/ }).click();
  await expect(whose.getByRole('button', { pressed: true })).toHaveCount(1);
  const scenarios = panel.getByRole('list', {
    name: /Fluent 2: the scenarios behind this verdict/,
  });
  await expect(scenarios.getByRole('button')).not.toHaveCount(0);
  await expect(scenarios).toContainText('Decided the verdict');
  // Choosing another scenario shows that one; exactly one is shown at a time.
  const buttons = await scenarios.getByRole('button').all();
  await buttons.at(-1)!.click();
  await expect(buttons.at(-1)!).toHaveAttribute('aria-pressed', 'true');
  await expect(scenarios.getByRole('button', { pressed: true })).toHaveCount(1);
});

test('every card says where its numbers come from and how to challenge them', async ({ page }) => {
  await page.goto(url);
  await openRule(page, 'bsp');
  const panel = page.locator('#rule-bsp');
  await panel
    .getByRole('group', { name: 'Whose recording' })
    .getByRole('button', { name: /MUI/ })
    .click();
  const provenance = panel.getByRole('list', { name: 'Provenance' });
  // Version, browser and date; runs and the engine version are in the raw file linked beside it.
  await expect(provenance).toContainText('MUI 9.5.0');
  await expect(provenance).toContainText('Chromium');
  // The date is the engine's, and moves with every re-measurement.
  await expect(provenance).toContainText(/\d{1,2} [A-Z][a-z]{2} \d{4}/);
  await expect(panel.getByRole('link', { name: 'Raw JSON' })).toHaveAttribute(
    'href',
    '/data/measurements/input-with-chips/mui.json',
  );
  await expect(panel.getByRole('link', { name: 'Suggest a correction' })).toHaveAttribute(
    'href',
    '/methodology/#corrections',
  );
});

test('the rule player can be paused (WCAG 2.2.2)', async ({ page }) => {
  await page.goto(url);
  const pause = page.locator('#rule-chip-stop').getByRole('button', { name: 'Pause' });
  await pause.click();
  await expect(
    page.locator('#rule-chip-stop').getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
});

test('Replay in playground plays the recorded keys into the live reference', async ({ page }) => {
  await page.goto(url);
  await page.locator('[data-chip-field][data-ready="true"]').waitFor();
  await openRule(page, 'bsp');
  await page.locator('#rule-bsp').getByRole('button', { name: 'Replay in playground' }).click();
  await expect(page.locator('[data-chip-field] [role="status"]')).toContainText('removed', {
    timeout: 5000,
  });
});

// 2026-11-13: a system's notes were a raw working log; what a reader should know is shown open.
// 2026-11-15: every note names its own source and date. One label over the block was wrong as
// soon as one note came from the engine's recording.
test('what to know about a component is shown open, each note with its source and date', async ({
  page,
}) => {
  await page.goto(url);
  await openRule(page, 'arrows');
  const panel = page.locator('#rule-arrows');
  const whose = panel.getByRole('group', { name: 'Whose recording' });
  await whose.getByRole('button', { name: /Chakra UI/ }).click();
  await expect(panel).toContainText('Worth knowing about this component');
  const seen = panel.getByRole('listitem').filter({ hasText: 'highlight a tag on screen' });
  await expect(seen).toContainText('Seen by hand on the measured page, 13 Nov 2026');
  await expect(panel).not.toContainText('packages/harness');
  // Atlassian has notes of both kinds; each says which it is.
  await whose.getByRole('button', { name: /Atlassian/ }).click();
  const recorded = panel.getByRole('listitem').filter({ hasText: 'describes its own arrow keys' });
  await expect(recorded).toContainText('Recorded by the engine, 17 Nov 2026');
  await expect(recorded).not.toContainText('Seen by hand');
  const byHand = panel.getByRole('listitem').filter({ hasText: 'Nothing on screen shows' });
  await expect(byHand).toContainText(
    'Seen in screenshots of the measured page, before and after each key, 15 Nov 2026',
  );
});

// 2026-11-13: the raw file opened as 53 KB on one line. It is served indented; the values are
// the engine's.
test('the raw file a card links to is indented, so a reader can find a verdict in it', async ({
  page,
  request,
}) => {
  await page.goto(url);
  await openRule(page, 'bsp');
  const href = await page
    .locator('#rule-bsp')
    .getByRole('link', { name: 'Raw JSON' })
    .getAttribute('href');
  const body = await (await request.get(href!)).text();
  expect(body.split('\n').length).toBeGreaterThan(500);
  expect(JSON.parse(body)).toHaveProperty('verdicts.bsp.verdict');
});

// 2026-11-13: violet is "what is heard", and speech on focus is heard as much as an announcement
// is. Every current spoken line has the one colour; the bar alone marks an announcement.
test('speech on focus and announcements share one colour, and only announcements carry the bar', async ({
  page,
}) => {
  // Reduced motion holds the replay on its last step, where both kinds of line are shown.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  await openRule(page, 'bsp');
  const lines = page.locator('#rule-bsp [data-source]:not([data-past])').filter({ visible: true });
  const styles = await lines.evaluateAll((nodes) =>
    nodes.map((node) => ({
      source: node.getAttribute('data-source'),
      color: getComputedStyle(node).color,
      bar: getComputedStyle(node).borderInlineStartWidth,
    })),
  );
  expect(styles.length).toBeGreaterThan(0);
  expect(new Set(styles.map(({ color }) => color)).size).toBe(1);
  for (const { source, bar } of styles) expect(bar).toBe(source === 'announcement' ? '2px' : '0px');
});

// Engine 0.14.0: a verdict may quote a live region that arrived with its text, so the recording
// beside the verdict has to show that region (verdict audit 2026-11-15).
test('a recording shows a live region that arrived with its text, next to the verdict that quotes it', async ({
  page,
}) => {
  await page.goto('/patterns/input-with-chips/#rule-say');
  const panel = page.locator('[role="tabpanel"][id="rule-say"]');
  await panel
    .getByRole('button', { name: /React Aria/ })
    .first()
    .click();
  await expect(panel).toContainText(
    'A live region arrived holding: “Irene OhGreg FisherHiroshi Matsui”.',
  );
  // The card says the outcome in a phrase; the full reason, which quotes the region, is in the
  // raw JSON it links to.
  await expect(panel).toContainText('Removal is not announced');
});
