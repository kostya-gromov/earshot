import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// The tabs page. It was built and reviewed on a preview route and moved to the patterns on
// 2026-11-19, on the owner's word after his VoiceOver check.
test.beforeEach(async ({ page }) => {
  await page.goto('/patterns/tabs/');
});

test('the page is one of the patterns, and nothing is left at the preview address', async ({
  page,
}) => {
  await expect(page.getByText('Preview, not published.')).toHaveCount(0);
  const kicker = page
    .locator('main p')
    .filter({ hasText: /^Pattern/ })
    .first();
  await expect(kicker).toContainText('4 of 5');
  await page.goto('/patterns/');
  await expect(page.getByRole('main').locator('a[href="/patterns/tabs/"]').first()).toBeVisible();
  const old = await page.goto('/lab/patterns/tabs/');
  expect(old?.status()).toBe(404);
});

test('the playground runs the reference and its tour counts real keys', async ({ page }) => {
  // The reference starts after its module loads: keys pressed before that reach no handler.
  const playground = page.locator('[data-tabs][data-ready="true"]').first();
  await playground.waitFor();
  await playground.getByRole('tab', { name: 'Overview', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(playground.getByRole('tab', { name: 'Activity', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(playground.getByRole('tab', { name: 'Settings', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByText('3 of 3 tried')).toBeVisible();
  // The panel is named by its tab, as the engine hears it from the tree.
  await expect(page.getByText('Settings, tabpanel').first()).toBeVisible();
});

test('the systems that were measured are the columns of the matrix', async ({ page }) => {
  const systems = page.getByRole('columnheader');
  await expect(systems).toHaveCount(5);
  await expect(systems.filter({ hasText: 'Atlassian' })).toHaveCount(1);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`has no axe violations in the ${colorScheme} theme`, async ({ page }) => {
    // Replays crossfade their words; contrast is judged on the settled page, not mid-fade.
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/patterns/tabs/');
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
  await page.goto('/patterns/tabs/');
  await page.locator('[data-tabs][data-ready="true"]').first().waitFor();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
});

// The playground hosts the reference's tabs: the ring the reference draws 4 px around a focused
// tab must not be cut by the card (design review, 2026-11-19, second pass). Judged on pixels: the
// 4 px beside the first tab's left edge and the last tab's right edge change when it has focus.
for (const width of [390, 1440]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`the playground draws the whole focus ring at the ends, ${width} ${colorScheme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.goto('/patterns/tabs/');
      const playground = page.locator('[data-tabs][data-ready="true"]').first();
      await playground.waitFor();
      for (const [name, side] of [
        ['Overview', 'left'],
        ['Settings', 'right'],
      ] as const) {
        const tab = playground.getByRole('tab', { name, exact: true });
        await tab.scrollIntoViewIfNeeded();
        const box = (await tab.boundingBox())!;
        const x = side === 'left' ? box.x - 4 : box.x + box.width;
        const clip = { x, y: box.y + 6, width: 4, height: box.height - 12 };
        const rest = await page.screenshot({ clip });
        await tab.focus();
        await page.keyboard.press('Shift');
        const focused = await page.screenshot({ clip });
        expect(Buffer.compare(rest, focused), `${name}: ring beside its ${side} edge`).not.toBe(0);
        await tab.blur();
      }
    });
  }
}

// The reference focuses a tab and then selects it. The spoken line is composed after the key's
// handler has finished, as the engine reads it after the step: with "selected" (design review,
// 2026-11-20: the line was read at the moment focus landed and left it out).
test('the spoken line of a tab reached by arrow says it is selected', async ({ page }) => {
  const playground = page.locator('[data-tabs][data-ready="true"]').first();
  await playground.waitFor();
  await playground.getByRole('tab', { name: 'Overview', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('Activity, tab, 2 of 4, selected').first()).toBeVisible();
});

// Engine 0.18.0 records when the document no longer has focus. In three systems the last
// Shift+Tab of this scenario goes on past the page's first field: Tab carried focus out of the
// page, which is not a loss, and the recording must not say or draw it as one (2026-11-22).
for (const system of ['React Aria', 'Chakra UI', 'Fluent 2']) {
  test(`${system}: Shift+Tab past the first field is focus that left the page, not a loss`, async ({
    page,
  }) => {
    // Reduced motion holds a replay on its last step.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/patterns/tabs/#rule-tab-in');
    const panel = page.locator('[role="tabpanel"][id="rule-tab-in"]');
    await panel
      .getByRole('button', { name: new RegExp(system) })
      .first()
      .click();
    for (const fold of await panel.getByRole('button', { name: /more scenarios?/ }).all()) {
      if ((await fold.getAttribute('aria-expanded')) === 'false') await fold.click();
    }
    await panel
      .getByRole('button', { name: /Shift\+Tab back into the tabs/ })
      .first()
      .click();
    await expect(panel).toContainText('Focus left the page.');
    await expect(panel).not.toContainText('Focus lost to the page');
    // No spoken line for that step: the model reads the page's tree, and focus is not in it.
    await expect(panel).toContainText('Not modelled: focus is outside the page');
    await expect(panel).not.toContainText('Earshot harness, document');
    // The sign and its legend line are there, in words as well as in the drawing.
    await expect(panel.getByText('focus outside the page', { exact: true })).toBeVisible();
  });
}

// Design review, 2026-11-22: at 390 the row of keys of this scenario (four Shift+Tab pairs and
// Play) is wider than the page, and it stretched the whole recording, so the sign under it was
// cut at the edge. The schematic keeps to the page now. The row of keys itself still overflows:
// wrapping it breaks the panel's row-stays invariant (docs/follow-ups/dialog.md).
test('at 390 wide, the sign for focus outside the page is inside the page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/patterns/tabs/#rule-tab-in');
  const panel = page.locator('[role="tabpanel"][id="rule-tab-in"]');
  await panel
    .getByRole('button', { name: /React Aria/ })
    .first()
    .click();
  for (const fold of await panel.getByRole('button', { name: /more scenarios?/ }).all()) {
    if ((await fold.getAttribute('aria-expanded')) === 'false') await fold.click();
  }
  await panel
    .getByRole('button', { name: /Shift\+Tab back into the tabs/ })
    .first()
    .click();
  await expect(panel).toContainText('Focus left the page.');
  // Hidden from assistive technology, like the rest of the schematic: found by its text.
  const box = (await panel.getByText('Outside the page', { exact: true }).first().boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(390);
});

// Design review, 2026-11-22: with the sign in the row, the box outside dropped to a new line for
// the one step whose panel shows a link, and the recording grew 50 px and shrank again on a
// loop. A drawing keeps one height from its first step to its last, at 320 as well: there the
// step whose panel shows a link was 4 px taller, until the narrow panel left its role label out.
for (const width of [1440, 390, 320]) {
  test(`at ${width} wide, the drawing keeps one height while the recording plays`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/patterns/tabs/#rule-tab-in');
    const panel = page.locator('[role="tabpanel"][id="rule-tab-in"]');
    await panel
      .getByRole('button', { name: /React Aria/ })
      .first()
      .click();
    for (const fold of await panel.getByRole('button', { name: /more scenarios?/ }).all()) {
      if ((await fold.getAttribute('aria-expanded')) === 'false') await fold.click();
    }
    await panel
      .getByRole('button', { name: /Shift\+Tab back into the tabs/ })
      .first()
      .click();
    // The schematic is hidden from assistive technology: found by a tab's name in it.
    const drawing = panel
      .locator('[aria-hidden="true"]')
      .filter({ hasText: /overview/i })
      .last();
    const heights = new Set<number>();
    const steps = new Set<string>();
    // One loop of the replay and more, sampled often enough to meet every step.
    for (let sample = 0; sample < 90; sample += 1) {
      heights.add(Math.round((await drawing.boundingBox())!.height));
      for (const words of ['link “Invite people”', 'Project name', 'Focus left the page']) {
        if (await panel.getByText(words).first().isVisible()) steps.add(words);
      }
      await page.waitForTimeout(100);
    }
    expect(steps.size, 'every step was met while sampling').toBe(3);
    expect([...heights]).toHaveLength(1);
  });
}

// Seen on 2026-11-22: where the drawing is narrow the row of tabs was cut at its edge, and
// "Settings" could not be read at 320. A drawing may not hide a word. The row stays on one line
// (a second line breaks the panel's list-stays invariant): the tabs take less room instead.
// MUI's names are in capitals in the tree and wider: they were cut at 1024 as well.
for (const { width, system } of [
  { width: 320, system: /React Aria/ },
  { width: 390, system: /React Aria/ },
  { width: 320, system: /MUI/ },
  { width: 1024, system: /MUI/ },
] as const) {
  test(`at ${width} wide, no tab of the ${system.source} schematic is cut`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/patterns/tabs/#rule-tab-in');
    const panel = page.locator('[role="tabpanel"][id="rule-tab-in"]');
    await panel.getByRole('button', { name: system }).first().click();
    // The schematic is hidden from assistive technology, so it is found by a tab's name in it.
    const drawing = panel.locator('[aria-hidden="true"]').filter({ hasText: 'Overview' }).last();
    // The list clips what runs past its edge: a tab is seen whole only when it ends inside it.
    const cut = await drawing.evaluate((root) => {
      const names = ['overview', 'activity', 'members', 'settings'];
      const tabs = [...root.querySelectorAll('span')].filter((span) =>
        names.includes((span.textContent ?? '').toLowerCase()),
      );
      if (tabs.length < 4) return ['the four tabs of the schematic were not found'];
      return tabs.flatMap((tab) => {
        const list = tab.parentElement!.getBoundingClientRect();
        const box = tab.getBoundingClientRect();
        return box.right > list.right + 0.5
          ? [
              `${tab.textContent}: ends at ${Math.round(box.right)}, the list at ${Math.round(list.right)}`,
            ]
          : [];
      });
    });
    expect(cut).toEqual([]);
  });
}

// Design review, 2026-11-22: once four presses of Shift+Tab were drawn as one key with a count,
// a press showed only as a digit changing. The key now dips on each press of a run. Motion of
// the Micro tier: none under reduced motion.
for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`a press inside a run of one key is ${reducedMotion === 'reduce' ? 'not animated under reduced motion' : 'seen as a press'}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/patterns/tabs/#rule-tab-in');
    const panel = page.locator('[role="tabpanel"][id="rule-tab-in"]');
    for (const fold of await panel.getByRole('button', { name: /more scenarios?/ }).all()) {
      if ((await fold.getAttribute('aria-expanded')) === 'false') await fold.click();
    }
    // Counted on the page itself, from before the scenario starts to play.
    await page.evaluate(() => {
      const seen = window as unknown as { keyPresses: number };
      seen.keyPresses = 0;
      document.addEventListener('animationstart', (event) => {
        if (event.animationName.includes('key-press')) seen.keyPresses += 1;
      });
    });
    await panel
      .getByRole('button', { name: /Shift\+Tab back into the tabs/ })
      .first()
      .click();
    if (reducedMotion === 'reduce') {
      await page.waitForTimeout(1500);
      expect(
        await page.evaluate(() => (window as unknown as { keyPresses: number }).keyPresses),
      ).toBe(0);
      return;
    }
    // Four presses in the run: at least three of them are met within one loop of the replay.
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { keyPresses: number }).keyPresses), {
        timeout: 12_000,
      })
      .toBeGreaterThanOrEqual(3);
  });
}
