import type { Page } from '@playwright/test';
import type { ChipsInteraction, ChipsState } from '../../scenarios/input-with-chips.ts';
import type { Adapter, SetupResult } from '../adapter.ts';
import { harnessRoot, harnessTarget, readHarnessVersion } from '../harness-target.ts';

/**
 * React Aria TokenField as the input of a ComboBox, rendered from react-aria-components by
 * packages/harness/react-aria-token-field. The field is one editable element with the role
 * combobox; its tokens are text inside it, not elements of their own in the accessibility tree.
 */
const input = (page: Page) => harnessRoot(page).getByRole('combobox', { name: 'To' });
// CSS: a token has no role or name of its own, so it cannot be found by role. This attribute is
// what the library puts on each token's wrapper.
const tokens = (page: Page) => input(page).locator('[data-react-aria-token]');

const zeroWidthSpace = /\u200b/g;

/** Text typed between the tokens: the field's text without the tokens' own. */
async function typedText(page: Page): Promise<string> {
  const [all, tokenTexts] = await Promise.all([
    input(page).innerText(),
    tokens(page).allInnerTexts(),
  ]);
  const withoutTokens = tokenTexts.reduce((text, token) => text.replace(token, ''), all);
  return withoutTokens.replace(zeroWidthSpace, '').trim();
}

/**
 * Checks the starting state, focuses the field and presses End. Focus alone leaves the caret
 * before the first token (Chromium's default for an editable element), while every scenario
 * starts where a user types: after the last chip. End is a real key press, nothing in the DOM is
 * changed; it is said in the state description and in the notes.
 */
async function setup(page: Page, { selectedItemCount }: ChipsState): Promise<SetupResult> {
  const count = await tokens(page).count();
  if (count !== selectedItemCount) {
    return { ok: false, reason: `Expected ${selectedItemCount} tokens, found ${count}.` };
  }
  if ((await typedText(page)) !== '') return { ok: false, reason: 'Input is not empty.' };
  await input(page).focus();
  await page.keyboard.press('End');
  if ((await input(page).getAttribute('aria-expanded')) === 'true') {
    return { ok: false, reason: 'The options menu is open.' };
  }
  return {
    ok: true,
    actualStateDescription: `${count} tokens, field focused, caret moved after the last token with End, menu closed`,
  };
}

export function createReactAriaTokenFieldAdapter(
  url: string,
): Adapter<ChipsState, ChipsInteraction> {
  return {
    id: 'react-aria-token-field',
    system: 'React Aria',
    version: 1,
    url,
    page: 'packages/harness/react-aria-token-field/index.html',
    root: harnessRoot,
    items: {
      locate: tokens,
      description: 'Token wrappers (data-react-aria-token) inside the editable field.',
    },
    ready: (page) => input(page).waitFor({ timeout: 20_000 }),
    setup,
    resolveClickTarget: () =>
      Promise.resolve({ ok: false, reason: 'Tokens have no remove control.' }),
    readVersion: readHarnessVersion,
    notes:
      'One editable element with the role combobox; tokens are text inside it and never take keyboard focus. Setup presses End after focusing, because focus alone puts the caret before the first token.',
  };
}

export const createReactAriaTokenFieldTarget = () =>
  harnessTarget('react-aria-token-field', createReactAriaTokenFieldAdapter);
