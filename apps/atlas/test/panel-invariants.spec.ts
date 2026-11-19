import { expect, test, type Page } from '@playwright/test';
import {
  changeSystems,
  checkHover,
  chooseFarthest,
  chooseScenarios,
  endState,
  panel,
  scenarioList,
  silentRows,
  useFold,
  walkFocus,
  type Finding,
  type Invariant,
  type Probe,
} from './panel/probe';
import { scrollThrough } from './panel/overlap';

// The properties a rule's panel keeps while it is used, on every pattern page, at every width,
// by pointer and by keyboard, with motion and without (see panel/probe.ts). A change to the
// panel that breaks one of them does not pass; a design review starts by running this file.
const base = process.env.PANEL_BASE_URL ?? '';

/*
 * `systemShift`: a known exception, kept from getting worse. A recording's place is as tall as
 * the tallest recording of the system shown, and systems differ, so the list under it moves
 * when another system is chosen. The numbers are the most it moved on 2026-11-16, in px; where
 * the property holds the number is 0. The height cannot be told from the data alone (it depends
 * on how the text wraps), and stacking every system's recordings to measure it was judged too
 * heavy. When it is solved the numbers go down to 0, and never up
 * (docs/follow-ups/rule-panel.md).
 *
 * `listShift`: the second known exception, kept the same way. A recording that shows no list
 * takes only the room it needs (2026-11-17: kept as tall as one with a list, it stood
 * over a large empty space), so between such a scenario and one with a list the chosen row
 * moves: by 238 px at most on combobox, measured that day. Between two scenarios of one kind it
 * may not move at all.
 */
const pages = [
  {
    id: 'chips',
    path: '/patterns/input-with-chips/',
    rule: /Backspace/,
    systemShift: 66,
    listShift: 0,
  },
  {
    id: 'combobox',
    path: '/patterns/combobox/',
    rule: /Expanded/,
    systemShift: 76,
    listShift: 238,
  },
  {
    id: 'menu',
    path: '/patterns/menu-button/',
    rule: /Expanded says/,
    systemShift: 0,
    listShift: 0,
  },
] as const;
const sizes = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
] as const;
const systems = ['react-aria', 'mui', 'reference'] as const;
const invariants: readonly Invariant[] = [
  'row-stays',
  'focus-seen',
  'recording-seen',
  'list-stays',
  'choice-seen',
  'keyboard-works',
  'no-motion',
  'choice-named',
  'hover-apart',
  'systems-seen',
  'systems-apart',
];

async function openRule(page: Page, path: string, rule: RegExp) {
  await page.goto(`${base}${path}`);
  await page.getByRole('tab', { name: rule }).first().click();
  // A newly shown rule rises 8 px into place. Nothing is measured before it has arrived: on a
  // busy machine the first row was read mid-rise and "moved" 6 to 8 px (design review,
  // 2026-11-16).
  await page
    .locator('[role="tabpanel"][id^="rule-"]:not([hidden])')
    .evaluate((panel) => Promise.all(panel.getAnimations().map(({ finished }) => finished)));
  await scenarioList(page).scrollIntoViewIfNeeded();
}

type Setting = Pick<Probe, 'mode' | 'isReduced' | 'systemShift' | 'listShift'>;

/** The same use of the panel, by one mode: scenarios, a fold, then other systems. */
async function usePanel(page: Page, setting: Setting): Promise<Finding[]> {
  const probe: Probe = { page, ...setting, findings: [] };
  await chooseScenarios(probe);
  await checkHover(probe);
  await useFold(probe);
  await chooseFarthest(probe);
  await changeSystems(probe, systems);
  await scrollThrough(probe);
  if (setting.mode === 'keyboard') await walkFocus(probe);
  return probe.findings;
}

for (const { id, path, rule, systemShift, listShift } of pages) {
  for (const { width, height } of sizes) {
    for (const motion of ['motion', 'reduced'] as const) {
      test(`${id} at ${width}, ${motion}`, async ({ browser }) => {
        const isReduced = motion === 'reduced';
        const context = await browser.newContext({
          viewport: { width, height },
          reducedMotion: isReduced ? 'reduce' : 'no-preference',
        });
        const findings: Finding[] = [];
        const ends = [];
        for (const mode of ['pointer', 'keyboard'] as const) {
          const page = await context.newPage();
          await openRule(page, path, rule);
          findings.push(...(await usePanel(page, { mode, isReduced, systemShift, listShift })));
          ends.push(await endState(page));
          await page.close();
        }
        await context.close();
        const isSame = JSON.stringify(ends[0]) === JSON.stringify(ends[1]);
        findings.push({
          invariant: 'keyboard-works',
          ok: isSame,
          detail: `pointer ended on ${JSON.stringify(ends[0])}, keyboard on ${JSON.stringify(ends[1])}`,
        });
        for (const invariant of invariants) {
          const broken = findings.filter((f) => f.invariant === invariant && !f.ok);
          // Kept with the result, so two builds can be compared property by property.
          test.info().annotations.push({
            type: invariant,
            description: broken.length === 0 ? 'holds' : broken.map((f) => f.detail).join('; '),
          });
          expect
            .soft(
              broken.map((f) => f.detail),
              invariant,
            )
            .toEqual([]);
        }
      });
    }
  }
}

/*
 * "row-says": every scenario row says a result, for every rule and every system: a mark and
 * words under its name. A verdict the engine reaches before judging any scenario on its own
 * ("Separate controls, not one widget") records no result per scenario, and its rows stood
 * with an empty place for the mark and no words, unlike every other row (2026-11-17).
 */
for (const { id, path } of pages) {
  test(`${id}: every scenario row says its result`, async ({ page }) => {
    await page.setViewportSize(sizes[0]);
    await page.goto(`${base}${path}`);
    const silent: string[] = [];
    const tabs = page.locator('[role="tab"][aria-controls^="rule-"]');
    for (const tab of await tabs.all()) {
      await tab.click();
      const rule = await tab.getAttribute('aria-controls');
      for (const system of await panel(page).locator('[data-system]').all()) {
        await system.click();
        const who = await system.getAttribute('data-system');
        for (const name of await silentRows(page)) silent.push(`${rule}, ${who}: "${name}"`);
      }
    }
    expect(silent).toEqual([]);
  });
}

/*
 * "choice-marked": in forced colours the chosen scenario and the chosen system still look
 * chosen. Their fill is a background, which forced colours take away, and nothing else set
 * them apart (design review, 2026-11-17). Judged on pixels: the same strip of a chosen row and
 * of one that is not chosen must not be the same picture.
 */
for (const { id, path, rule } of pages) {
  test(`${id}: in forced colours the chosen rows look chosen`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: sizes[0], forcedColors: 'active' });
    const page = await context.newPage();
    await openRule(page, path, rule);
    for (const group of [scenarioList(page), panel(page).getByRole('group')]) {
      // A rule with one scenario has no row that is not chosen to tell the chosen one from.
      if ((await group.locator('button[aria-pressed="false"]:visible').count()) === 0) continue;
      const strips = [];
      for (const pressed of ['true', 'false']) {
        const row = group.locator(`button[aria-pressed="${pressed}"]:visible`).first();
        await row.scrollIntoViewIfNeeded();
        const box = await row.boundingBox();
        if (!box) throw new Error(`no ${pressed} row to compare`);
        // The row's leading edge, clear of its mark and words, which differ from row to row;
        // of one size, so a taller row is not taken for a chosen one.
        const clip = { x: box.x, y: box.y + 8, width: 8, height: 16 };
        strips.push((await page.screenshot({ clip })).toString('base64'));
      }
      expect(strips[0], 'chosen and not chosen').not.toBe(strips[1]);
    }
    await context.close();
  });
}
