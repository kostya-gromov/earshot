import type { Locator, Page } from '@playwright/test';

/*
 * What a rule's panel must keep true while it is used: pick scenarios, open and close a fold,
 * change system. Each probe drives the page as a person would, by pointer or by keyboard, and
 * returns what it found; the spec decides what fails. Written after a day in which every change
 * to the panel broke a neighbouring property that nothing guarded (2026-11-16).
 */

export type Invariant =
  | 'row-stays' // the row that was chosen does not move under the pointer
  | 'focus-seen' // a focused control is never under other content
  | 'recording-seen' // the recording is on screen after a scenario is chosen
  | 'list-stays' // the list does not move when another system is chosen
  | 'choice-seen' // the chosen scenario is never hidden
  | 'keyboard-works' // every control answers the keyboard as it answers the pointer
  | 'no-motion' // under reduced motion nothing animates
  | 'choice-named' // what was chosen is named on screen: its row, or the recording's title
  | 'hover-apart' // a row under the pointer never looks like the chosen one
  | 'systems-seen' // beside the list, the systems stay on screen while scenarios are chosen
  | 'systems-apart'; // the systems never lie over the evidence under the two columns

export interface Finding {
  invariant: Invariant;
  ok: boolean;
  detail: string;
}

export type Mode = 'pointer' | 'keyboard';

export interface Probe {
  page: Page;
  mode: Mode;
  isReduced: boolean;
  /**
   * How far the list may move when another system is chosen: a ratchet, not a goal. Zero where
   * the property holds; where it does not yet, the most it moved when this was measured, so it
   * cannot get worse (docs/follow-ups/rule-panel.md).
   */
  systemShift: number;
  /**
   * How far the chosen row may move between a scenario that shows no list and one that shows
   * one: the same kind of ratchet. A recording with no list takes only the room it needs
   * (2026-11-17), so the rows below move there; between two scenarios of one kind the
   * row still may not move at all.
   */
  listShift: number;
  findings: Finding[];
}

/** A shift of a pixel or two is rounding; more is a row that moved. */
const tolerance = 2;

export const panel = (page: Page) => page.locator('[role="tabpanel"][id^="rule-"]:not([hidden])');
export const scenarioList = (page: Page) =>
  panel(page).locator('ul[aria-label$="the scenarios behind this verdict"]').first();
const rows = (page: Page) => scenarioList(page).locator('button[aria-pressed]:visible');
/** The names of the scenario rows that show no result: no mark, or no words under the name. */
export const silentRows = (page: Page) =>
  rows(page).evaluateAll((buttons) =>
    buttons
      .filter((button) => {
        const hasMark = button.querySelector('[data-mark-only]') !== null;
        const hasWords = button.textContent !== button.querySelector('b')?.textContent;
        return !hasMark || !hasWords;
      })
      .map((button) => button.querySelector('b')?.textContent ?? ''),
  );
const folds = (page: Page) => scenarioList(page).getByRole('button', { name: /more scenarios?/ });
const systemButton = (page: Page, id: string) => panel(page).locator(`[data-system="${id}"]`);

/** Where an element is in the document, whatever the scroll position. */
const pageTop = (locator: Locator) =>
  locator.evaluate((el) => Math.round(el.getBoundingClientRect().top + window.scrollY));

/** Records what was found about one invariant: `note(probe, 'row-stays')(ok, detail)`. */
export const note = (probe: Probe, invariant: Invariant) => (ok: boolean, detail: string) =>
  probe.findings.push({ invariant, ok, detail: `${probe.mode}: ${detail}` });

/** Long enough for the site's longest functional motion; a frame or two when motion is off. */
const settle = ({ page, isReduced }: Probe) => page.waitForTimeout(isReduced ? 120 : 450);

/** Under reduced motion: nothing longer than the 100 ms crossfade the site allows, no slow scroll. */
async function checkStill(probe: Probe, what: string) {
  if (!probe.isReduced) return;
  const running = await probe.page.evaluate(() =>
    document
      .getAnimations()
      .filter((animation) => animation.playState === 'running')
      .map((animation) => ({
        ms: Number(animation.effect?.getComputedTiming().duration ?? 0),
        name: 'animationName' in animation ? String(animation.animationName) : 'transition',
      }))
      .filter(({ ms }) => ms > 100)
      .map(({ ms, name }) => `${name} ${ms} ms`),
  );
  const before = await probe.page.evaluate(() => window.scrollY);
  await probe.page.waitForTimeout(150);
  const after = await probe.page.evaluate(() => window.scrollY);
  const isStill = running.length === 0 && before === after;
  note(probe, 'no-motion')(
    isStill,
    `${what}: ${running.length} animation(s) ${running.join(', ')}, scroll ${after - before} px`,
  );
}

/** Uses a control the way the mode says: a click, or focus and Enter. */
async function use(probe: Probe, control: Locator) {
  if (probe.mode === 'pointer') return control.click();
  await control.focus();
  return probe.page.keyboard.press('Enter');
}

/** The part of an element inside the window, and whether its middle is under something else. */
const sight = (locator: Locator) =>
  locator.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const seen = Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0));
    const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return {
      share: box.height === 0 ? 0 : seen / box.height,
      isCovered: seen > 0 && top !== null && !el.contains(top) && !top.contains(el),
    };
  });

async function checkChoice(probe: Probe, what: string) {
  const chosen = rows(probe.page).and(probe.page.locator('[aria-pressed="true"]'));
  const count = await chosen.count();
  note(probe, 'choice-seen')(count === 1, `${what}: ${count} chosen row(s) shown`);
}

async function checkRecording(probe: Probe, what: string) {
  const control = panel(probe.page)
    .getByRole('button', { name: /^(Pause|Play)$/ })
    .first();
  if ((await control.count()) === 0) return;
  const { share } = await sight(control);
  note(probe, 'recording-seen')(
    // A pixel of the control cut by rounding is still the recording on screen.
    share >= 0.9,
    `${what}: ${Math.round(share * 100)}% of its control in the window`,
  );
}

/** The name of what plays is on screen: on its row, or on the recording itself. */
async function checkNamed(probe: Probe, label: string) {
  const named = panel(probe.page).getByText(label, { exact: true }).filter({ visible: true });
  const shares = await named.evaluateAll((els) =>
    els.map((el) => {
      const box = el.getBoundingClientRect();
      // Against the window's very edge a name is cut off from the page above it: 8 px of room.
      const seen = Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 8));
      return box.height === 0 ? 0 : seen / box.height;
    }),
  );
  const best = Math.max(0, ...shares);
  note(probe, 'choice-named')(
    best >= 0.9,
    `“${label}”: named ${shares.length} time(s), at most ${Math.round(best * 100)}% in the window, 8 px from its top`,
  );
}

/** Where the systems stand beside the list, the chosen one stays on screen with it. */
async function checkSystems(probe: Probe, label: string) {
  const chosen = panel(probe.page).locator('[data-system][aria-pressed="true"]');
  const isBeside = await chosen.evaluate((button) => {
    const list = button
      .closest('[role="tabpanel"]')
      ?.querySelector('ul[aria-label$="the scenarios behind this verdict"]');
    return !!list && button.getBoundingClientRect().left >= list.getBoundingClientRect().right;
  });
  if (!isBeside) return;
  const { share } = await sight(chosen);
  note(probe, 'systems-seen')(
    share >= 0.9,
    `“${label}” chosen: ${Math.round(share * 100)}% of the chosen system in the window`,
  );
}

type Pixel = readonly [number, number, number];

/**
 * The colour of a row's background as it is painted: one pixel in its top padding, above the
 * words. The row is brought into the window first; a row under the pointer already is.
 */
async function paintOf(probe: Probe, row: Locator): Promise<Pixel> {
  await row.scrollIntoViewIfNeeded();
  const box = await row.boundingBox();
  if (!box) return [0, 0, 0];
  const clip = { x: box.x + box.width / 2, y: box.y + 3, width: 1, height: 1 };
  const shot = (await probe.page.screenshot({ clip })).toString('base64');
  return probe.page.evaluate(async (data) => {
    const png = await (await fetch(`data:image/png;base64,${data}`)).blob();
    const context = new OffscreenCanvas(1, 1).getContext('2d');
    if (!context) return [0, 0, 0] as const;
    context.drawImage(await createImageBitmap(png), 0, 0);
    const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
    return [red, green, blue] as const;
  }, shot);
}

/** How far apart two painted colours are: the largest difference in one channel, of 255. */
const apart = (a: Pixel, b: Pixel) =>
  Math.max(...a.map((value, at) => Math.abs(value - (b[at] ?? 0))));

const inkOf = (row: Locator) =>
  row
    .locator('b')
    .first()
    .evaluate((title) => getComputedStyle(title).color);

/**
 * A row under the pointer answers, and never looks like the chosen one. As painted: its fill
 * stays a plain row's (the fill is the chosen row's alone, and is seen: at least 4 of 255 from
 * plain in one channel), and its title changes ink, so the pointer is answered.
 */
export async function checkHover(probe: Probe) {
  if (probe.mode !== 'pointer') return;
  for (const [what, all] of [
    ['scenario', rows(probe.page)],
    ['system', panel(probe.page).locator('[data-system]')],
  ] as const) {
    const other = all.and(probe.page.locator('[aria-pressed="false"]')).first();
    const chosen = all.and(probe.page.locator('[aria-pressed="true"]')).first();
    if ((await other.count()) === 0 || (await chosen.count()) === 0) continue;
    await probe.page.mouse.move(0, 0);
    await settle(probe);
    const [plain, pressed] = [await paintOf(probe, other), await paintOf(probe, chosen)];
    const inkBefore = await inkOf(other);
    await other.hover();
    await settle(probe);
    const [hovered, ink] = [await paintOf(probe, other), await inkOf(other)];
    note(probe, 'hover-apart')(
      apart(hovered, plain) <= 1 && apart(hovered, pressed) >= 4 && ink !== inkBefore,
      `${what}: plain ${plain.join(' ')}, hovered ${hovered.join(' ')}, chosen ${pressed.join(' ')}; ink ${inkBefore} → ${ink}`,
    );
  }
  await probe.page.mouse.move(0, 0);
}

/** Whether the recording shown keeps room for its system's tallest one: it does when it has a list. */
const keepsRoom = async (probe: Probe) =>
  (await panel(probe.page).locator('[class*="ghost"]').count()) > 0;

/** Chooses a scenario and checks everything that must hold right after. */
async function choose(probe: Probe, row: Locator) {
  const label = (await row.locator('b').first().innerText()).slice(0, 40);
  const before = await pageTop(row);
  const hadRoom = await keepsRoom(probe);
  await use(probe, row);
  await checkStill(probe, `choose “${label}”`);
  await settle(probe);
  const moved = (await pageTop(row)) - before;
  // Room is kept (the unseen recordings are there) only while the scenario shown has a list.
  const limit = hadRoom === (await keepsRoom(probe)) ? 0 : probe.listShift;
  note(probe, 'row-stays')(
    Math.abs(moved) <= limit + tolerance,
    `“${label}” moved ${moved} px (allowed: ${limit})`,
  );
  const isPressed = (await row.getAttribute('aria-pressed')) === 'true';
  note(probe, 'keyboard-works')(isPressed, `“${label}” ${isPressed ? 'is' : 'is not'} chosen`);
  await checkRecording(probe, `“${label}” chosen`);
  await checkChoice(probe, `“${label}” chosen`);
  await checkNamed(probe, label);
  await checkSystems(probe, label);
}

/** The first rows, and the last: the one farthest from the recording. */
export async function chooseScenarios(probe: Probe) {
  const count = await rows(probe.page).count();
  for (const index of [...new Set([0, 1, count - 1])].filter((i) => i >= 0 && i < count)) {
    await choose(probe, rows(probe.page).nth(index));
  }
}

/** Opens the first fold, chooses its last scenario, and closes the fold over it. */
export async function useFold(probe: Probe) {
  const fold = folds(probe.page).first();
  if ((await fold.count()) === 0) return;
  await use(probe, fold);
  await checkStill(probe, 'open a fold');
  await settle(probe);
  const isOpen = (await fold.getAttribute('aria-expanded')) === 'true';
  note(probe, 'keyboard-works')(isOpen, `the fold ${isOpen ? 'opened' : 'did not open'}`);
  const inside = scenarioList(probe.page).locator('ul button[aria-pressed]:visible');
  if ((await inside.count()) > 0) await choose(probe, inside.last());
  // Its label changes when it closes over a chosen scenario, so it is found again by place.
  await use(probe, folds(probe.page).first());
  await checkStill(probe, 'close a fold');
  await settle(probe);
  await checkChoice(probe, 'a fold closed over the chosen scenario');
  // The row kept under the closed fold must not take the rows below with it when it goes.
  await choose(probe, rows(probe.page).last());
}

/** With every fold open the list is at its longest: the row farthest from the top is chosen. */
export async function chooseFarthest(probe: Probe) {
  for (const fold of await folds(probe.page).all()) {
    if ((await fold.getAttribute('aria-expanded')) !== 'true') await use(probe, fold);
  }
  await settle(probe);
  await choose(probe, rows(probe.page).last());
}

/** Goes from system to system and checks that the list stays where it is. */
export async function changeSystems(probe: Probe, systems: readonly string[]) {
  for (const id of systems) {
    const first = rows(probe.page).first();
    const before = await pageTop(first);
    await use(probe, systemButton(probe.page, id));
    await checkStill(probe, `choose ${id}`);
    await settle(probe);
    const isChosen = (await systemButton(probe.page, id).getAttribute('aria-pressed')) === 'true';
    note(probe, 'keyboard-works')(isChosen, `${id} ${isChosen ? 'is' : 'is not'} chosen`);
    const moved = (await pageTop(rows(probe.page).first())) - before;
    const limit = probe.systemShift + tolerance;
    note(probe, 'list-stays')(
      Math.abs(moved) <= limit,
      `to ${id}: the list moved ${moved} px (allowed: ${probe.systemShift})`,
    );
    await checkChoice(probe, `${id} chosen`);
  }
}

/** Tab down the list and Shift+Tab back: every stop must be seen, whole, with nothing over it. */
export async function walkFocus(probe: Probe) {
  const stops = scenarioList(probe.page).locator('button:visible');
  const count = await stops.count();
  await stops.first().focus();
  const hidden: string[] = [];
  const look = async () => {
    const focused = probe.page.locator(':focus');
    if (!(await scenarioList(probe.page).locator(':focus').count())) return;
    const { share, isCovered } = await sight(focused);
    if (share >= 0.9 && !isCovered) return;
    const words = (await focused.innerText()).replace(/\s+/g, ' ').slice(0, 40);
    const how = isCovered ? 'under other content' : `${Math.round(share * 100)}% in the window`;
    hidden.push(`“${words}” ${how}`);
  };
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let stop = 0; stop < count; stop += 1) {
      await look();
      await probe.page.keyboard.press(key);
    }
  }
  note(probe, 'focus-seen')(
    hidden.length === 0,
    `${hidden.length} of ${count * 2} stops hidden: ${hidden.slice(0, 4).join(' | ')}`,
  );
}

/** What the panel shows in the end, to compare what the pointer and the keyboard reached. */
export const endState = (page: Page) =>
  panel(page).evaluate((root) => ({
    system: root.querySelector('[data-system][aria-pressed="true"]')?.getAttribute('data-system'),
    scenario: root.querySelector(
      'ul[aria-label$="the scenarios behind this verdict"] [aria-pressed="true"] b',
    )?.textContent,
  }));
