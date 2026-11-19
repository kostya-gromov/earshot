import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const url = '/patterns/input-with-chips/';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`pattern page has no axe violations in the ${colorScheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto(url);
    await page.locator('[data-chip-field][data-ready="true"]').waitFor();
    // Chips fade in; contrast is judged on the settled page, not mid-animation.
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

const matrix = (page: Page) =>
  page.getByRole('grid', { name: 'Every rule against every measured system' });
const cells = (page: Page) => matrix(page).getByRole('gridcell').getByRole('link');
const rulesTabs = (page: Page) => page.getByRole('tablist', { name: 'Rules' });
const rawData = (page: Page) =>
  page
    .getByRole('paragraph')
    .filter({ hasText: /^Raw data/ })
    .getByRole('link');
const comparison = (page: Page) => page.getByRole('region', { name: /^Every system, every rule/ });
const picker = (page: Page) => page.getByRole('group', { name: 'Compare with' });

const ruleIds = ['chip-stop', 'chip-arrows', 'tab', 'arrows', 'bsp', 'keep-focus', 'say', 'count'];
// Counted systems first, then the two that are shown but not counted.
const systemIds = ['atlassian', 'chakra', 'fluent', 'mui', 'primer', 'react-aria'];

test('the matrix shows every rule against every measured system', async ({ page }) => {
  await page.goto(url);
  await expect(matrix(page).getByRole('rowheader')).toHaveCount(ruleIds.length);
  await expect(matrix(page).getByRole('columnheader')).toHaveCount(systemIds.length);
  // Each verdict links its own evidence: rule, then system.
  const hrefs = await cells(page).evaluateAll((links) => links.map((a) => a.getAttribute('href')));
  expect(hrefs).toEqual(ruleIds.flatMap((rule) => systemIds.map((s) => `#ev-${rule}-${s}`)));
  // The deprecated component is shown, and says it is not counted.
  await expect(matrix(page).getByRole('columnheader', { name: /GitHub Primer/ })).toContainText(
    'not counted',
  );
});

test('the matrix is one Tab stop; arrows, Home and End move between verdicts', async ({ page }) => {
  await page.goto(url);
  const tabbable = cells(page).and(page.locator('[tabindex="0"]'));
  await expect(tabbable).toHaveCount(1);
  await cells(page).first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('a[href="#ev-chip-stop-chakra"]')).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.locator('a[href="#ev-chip-stop-react-aria"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('a[href="#ev-chip-arrows-react-aria"]')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.locator('a[href="#ev-chip-arrows-atlassian"]')).toBeFocused();
  // Still one Tab stop after moving: the focused cell is the one that takes Tab.
  await expect(tabbable).toHaveCount(1);
});

test('Enter on a verdict opens its rule with that system’s recording', async ({ page }) => {
  await page.goto(url);
  await page.locator('a[href="#ev-bsp-react-aria"]').focus();
  await page.keyboard.press('Enter');
  await expect(rulesTabs(page).getByRole('tab', { name: /Backspace twice/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(
    page
      .locator('#rule-bsp')
      .getByRole('group', { name: 'Whose recording' })
      .getByRole('button', { name: /React Aria/ }),
  ).toBeFocused();
});

// WCAG 2.5.3: a speech user says what they see. Found 2026-11-11: cells showed "Inconclusive"
// while their name said "Not judged".
test('every verdict’s accessible name contains the word it shows', async ({ page }) => {
  await page.goto(url);
  const mismatches = await cells(page).evaluateAll((links) =>
    links
      .filter(
        (a) =>
          !(a.getAttribute('aria-label') ?? a.textContent ?? '').includes(
            a.textContent?.trim() ?? '',
          ),
      )
      .map((a) => `${a.getAttribute('href')}: shows "${a.textContent?.trim()}"`),
  );
  expect(mismatches).toEqual([]);
});

test('each rule’s agreement matches the measurement files it is built from', async ({
  page,
  request,
}) => {
  await page.goto(url);
  const notCounted = ['GitHub Primer', 'React Aria'];
  const links = rawData(page);
  const files = await Promise.all(
    (await links.all()).map(async (link) => {
      const response = await request.get((await link.getAttribute('href'))!);
      return (await response.json()) as {
        target: { system: string };
        verdicts: Record<string, { verdict: string }>;
      };
    }),
  );
  const counted = files.filter((file) => !notCounted.includes(file.target.system));
  for (const rule of ruleIds) {
    const verdicts = counted.map((file) => file.verdicts[rule]?.verdict);
    const follows = verdicts.filter((v) => v === 'follows').length;
    const judged = follows + verdicts.filter((v) => v === 'differs').length;
    await rulesTabs(page).locator(`#tab-${rule}`).click();
    await expect(page.locator(`#rule-${rule}`)).toContainText(
      `${follows} of ${judged} judged systems follow`,
    );
  }
});

test('every Raw data link serves the measurement it is named after', async ({ page, request }) => {
  await page.goto(url);
  const links = rawData(page);
  await expect(links).toHaveCount(systemIds.length);
  for (const link of await links.all()) {
    const response = await request.get((await link.getAttribute('href'))!);
    expect(response.ok()).toBe(true);
    const body = (await response.json()) as { target: { system: string } };
    expect(body.target.system).toBe(await link.innerText());
  }
});

test('Compare with: two systems to start, a third adds its recording, a fourth is refused', async ({
  page,
}) => {
  await page.goto(url);
  const lanes = comparison(page).getByRole('article').getByRole('heading', { level: 3 });
  // Counted systems only in the first view: React Aria is shown but not counted since 2026-11-13.
  await expect(lanes).toHaveText([/^Reference/, /^Atlassian/, /^Fluent 2/]);
  await picker(page).getByRole('button', { name: 'Chakra UI' }).click();
  await expect(picker(page).getByRole('button', { name: /Chakra UI/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(lanes).toHaveCount(4);
  await expect(page).toHaveURL(/compare=[^&]*chakra/);

  const mui = picker(page).getByRole('button', { name: 'MUI' });
  await expect(mui).toHaveAttribute('aria-disabled', 'true');
  await expect(mui).toHaveAccessibleDescription('Up to 3 at a time. Remove one to add another.');
  await mui.focus();
  await page.keyboard.press('Enter');
  await expect(mui).toHaveAttribute('aria-pressed', 'false');
  await expect(lanes).toHaveCount(4);
});

test('what no cited standard asks for is labelled an Atlas recommendation', async ({ page }) => {
  await page.goto(url);
  await expect(
    matrix(page).getByRole('rowheader', { name: /^The chips are one Tab stop/ }),
  ).toContainText('From the standards');
  // Two more since 2026-11-17: no cited page names Left and Right Arrow for chips in a row, or
  // says where focus goes after a removal.
  for (const title of [
    /^Arrows move between/,
    /^Keep focus/,
    /^One stop/,
    /^Arrows join/,
    /^Backspace/,
    /^Announce/,
    /^Say how many/,
  ]) {
    await expect(matrix(page).getByRole('rowheader', { name: title })).toContainText(
      'Atlas recommendation',
    );
  }
  // A WCAG criterion cited only as related says what it does not ask.
  await expect(page.locator('#rule-chip-stop')).toContainText(
    'Related: 2.1.1 asks that every chip',
  );
});

test('Primer is shown, said once to be not counted, and left out of agreement', async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.getByText('GitHub Primer is measured but not counted')).toHaveCount(1);
  const panel = page.locator('#rule-chip-stop');
  await expect(panel.getByRole('list', { name: 'Verdict by system' })).not.toContainText('Primer');
  await expect(panel.getByRole('group', { name: 'Whose recording' })).toContainText(
    'Not counted: its component is deprecated by its maintainers',
  );
});

test('a difference is filed under the alternative the system takes', async ({ page }) => {
  await page.goto(url);
  // Since 2026-11-13 a trade-off is a row: who takes it on the left, the alternative beside it.
  const tradeOff = (panel: string, alternative: string) =>
    page
      .locator(`#rule-${panel} section`)
      .filter({ has: page.getByRole('heading', { level: 5, name: new RegExp(alternative) }) });
  const who = (panel: string, alternative: string) =>
    tradeOff(panel, alternative).getByRole('list', { name: 'Measured differences' });
  await expect(who('chip-stop', 'own Tab stop inside each chip')).toContainText('React Aria');
  await rulesTabs(page).locator('#tab-tab').click();
  await expect(who('tab', 'group of chips')).toContainText('Fluent 2');
  await expect(who('tab', 'group of chips')).not.toContainText('Atlassian');
  // Separate remove buttons are not one widget, so their stops are charged here, under tab.
  await expect(who('tab', 'every remove button')).toContainText('Atlassian');
});

// Trade-off editorial pass, 2026-11-13: systems that differ in the same words are told once, and
// a system is never filed under a behaviour it lacks. Primer's first Backspace returns the value
// to the input as text, so since the design review of the same day it has an alternative of its
// own and no longer sits under "Other measured differences" with the others' summary.
test('Primer is listed apart from the systems that remove on the first Backspace', async ({
  page,
}) => {
  await page.goto(url);
  await rulesTabs(page).locator('#tab-bsp').click();
  const panel = page.locator('#rule-bsp');
  await expect(panel.getByRole('heading', { level: 4, name: 'Why systems differ' })).toBeVisible();
  const under = (alternative: RegExp) =>
    panel
      .locator('section')
      .filter({ has: page.getByRole('heading', { level: 5, name: alternative }) });
  await expect(under(/remove on the first Backspace/)).toContainText('Atlassian and MUI');
  await expect(under(/remove on the first Backspace/)).not.toContainText('Primer');
  await expect(under(/back into text/)).toContainText('GitHub Primer');
  await expect(panel.getByRole('region', { name: 'Other measured differences' })).toHaveCount(0);
});

test('systems without the component are named, with evidence', async ({ page }) => {
  await page.goto(url);
  const absent = page.getByText('No equivalent component:').locator('..');
  for (const system of ['IBM Carbon', 'Adobe Spectrum', 'Material 3', 'GOV.UK']) {
    await expect(absent.getByRole('link', { name: new RegExp(system) })).toHaveAttribute(
      'href',
      /^https:\/\//,
    );
  }
});

test('the page does not scroll sideways on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

test('the pattern page says what Atlas is not in one line, not the full statement', async ({
  page,
}) => {
  await page.goto(url);
  const note = page.getByRole('complementary', { name: 'How to read Atlas' });
  await expect(note).toContainText('Guidance, not certification.');
  await expect(note.getByRole('link', { name: 'Read the methodology' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Guidance, not certification' })).toHaveCount(0);
});

test('the readout under the matrix repeats the cell under the pointer or focus', async ({
  page,
}) => {
  await page.goto(url);
  // aria-hidden: the cell's own name already says it to assistive technology.
  const readout = page.getByRole('main').locator('p[aria-hidden="true"]').filter({ hasText: /./ });
  await page.locator('a[href="#ev-tab-atlassian"]').hover();
  await expect(readout).toHaveText(/^Atlassian, One stop for the whole field: Differs/);
  await page.locator('a[href="#ev-say-mui"]').focus();
  await expect(readout).toHaveText(/^MUI, Announce the removal: Differs/);
});

test('a verdict judged on part of its scenarios says how many', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('a[href="#ev-tab-atlassian"]')).toHaveAccessibleName(
    /Judged on 2 of 3 scenarios/,
  );
  await expect(page.locator('a[href="#ev-tab-mui"]')).not.toHaveAccessibleName(/Judged on/);
});

// Found 2026-11-11: on a phone the tab list is not sticky, so the bar was measured from a far
// ancestor before fonts settled and sat 59-115 px above the selected tab until a click.
// From the design review of 2026-11-11 the list is a row on a phone, with the bar under the tab.
for (const width of [390, 1440]) {
  test(`at ${width} px the selected rule's bar sits on the selected tab from the start`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    const offset = () =>
      page.evaluate(() => {
        const list = document.querySelector('[role="tablist"][aria-label="Rules"]')!;
        const bar = list.querySelector('[aria-hidden="true"]')!.getBoundingClientRect();
        const tab = list.querySelector('[aria-selected="true"]')!.getBoundingClientRect();
        const isRow = list.getAttribute('aria-orientation') === 'horizontal';
        const along = isRow
          ? Math.abs(bar.left - tab.left) + Math.abs(bar.width - tab.width)
          : Math.abs(bar.top - tab.top) + Math.abs(bar.height - tab.height);
        const across = isRow ? Math.abs(bar.bottom - tab.bottom) : Math.abs(bar.left - tab.left);
        return Math.round(along + across);
      });
    await expect.poll(offset).toBe(0);
  });
}

// Found 2026-11-11: the bar is a background, which forced colours replace, so the selected rule
// looked like every other one. It must stay visible in the system's own colours.
test('in forced colours the selected rule is still marked', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(url);
  // The bar is drawn once the tab list has measured its tabs; on a busy machine that is not at once.
  await page
    .locator('[role="tablist"][aria-label="Rules"] [aria-hidden="true"]')
    .waitFor({ state: 'attached' });
  const colours = await page.evaluate(() => {
    const bar = document.querySelector(
      '[role="tablist"][aria-label="Rules"] [aria-hidden="true"]',
    )!;
    return {
      bar: getComputedStyle(bar).backgroundColor,
      page: getComputedStyle(document.body).backgroundColor,
    };
  });
  expect(colours.bar).not.toBe(colours.page);
  expect(colours.bar).not.toBe('rgba(0, 0, 0, 0)');
});

// WCAG 1.4.11: a verdict mark is a graphic needed to understand the matrix, so it keeps 3:1.
// Opacity cut it to about 2.4:1 in the light theme; not-counted and model cells now use other cues.
test('no verdict mark in the matrix is faded with opacity', async ({ page }) => {
  await page.goto(url);
  const faded = await cells(page).evaluateAll((links) =>
    links.flatMap((link) => {
      let opacity = 1;
      for (let el: Element | null = link; el; el = el.parentElement) {
        opacity *= Number(getComputedStyle(el).opacity);
      }
      return opacity < 1 ? [`${link.getAttribute('href')}: ${opacity.toFixed(2)}`] : [];
    }),
  );
  expect(faded).toEqual([]);
});

// WCAG 1.4.1: whether a spoken line came from focus or from a live region was told by colour
// alone, and forced colours erased it. Announcements now carry a bar, in the legend too.
test('a live region line differs from a focus line by more than colour', async ({ page }) => {
  await page.goto(url);
  // Two real keys give one line of each kind: focus lands on a chip, then its removal is said.
  await page.locator('[data-chip-field][data-ready="true"]').waitFor();
  await page.getByTestId('live-reference').getByRole('combobox', { name: 'To' }).focus();
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await expect(page.getByRole('log', { name: 'Transcript' })).toContainText('removed');
  const bars = await page.evaluate(() => {
    const bar = (el: Element | null) => (el ? getComputedStyle(el).borderInlineStartWidth : 'none');
    const log = document.querySelector('[role="log"][aria-label="Transcript"]');
    return {
      heard: bar(log?.querySelector('[data-source="announcement"]') ?? null),
      focus: bar(log?.querySelector('[data-source="focus"]') ?? null),
    };
  });
  expect(bars.heard).not.toBe('0px');
  expect(bars.focus).toBe('0px');
});
