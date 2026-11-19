import { describe, expect, it } from 'vitest';
import { evaluateEnter } from '../../../src/evaluators/combobox/enter.ts';
import { evaluateEscape } from '../../../src/evaluators/combobox/escape.ts';
import { evaluateExpanded } from '../../../src/evaluators/combobox/expanded.ts';
import { evaluateSayCount } from '../../../src/evaluators/combobox/say-count.ts';
import { evaluateSayResults } from '../../../src/evaluators/combobox/say-results.ts';
import { evaluateTab } from '../../../src/evaluators/combobox/tab.ts';
import {
  active,
  closed,
  combobox,
  elsewhere,
  focusedOption,
  fruit,
  open,
  popup,
  press,
  type,
  walk,
  type Moment,
} from './fixtures.ts';

const down = press('ArrowDown');
const tab = press('Tab');
const enter = press('Enter');
const escape = press('Escape');

const button = (name: string): Moment => ({
  focus: { role: 'button', name, states: {}, isBody: false, isInsideComponent: true },
  popup: closed().popup,
});

describe('evaluateTab', () => {
  const tabOut = (afterTab: Moment, afterBack: Moment) =>
    walk('tab-out', closed(), [
      [tab, afterTab],
      [press('Shift+Tab'), afterBack],
    ]);
  const tabOpen = (beforeTab: Moment, afterTab: Moment) =>
    walk('tab-open', closed(), [
      [type('a'), open()],
      [down, beforeTab],
      [tab, afterTab],
    ]);

  it('follows when Tab leaves and Shift+Tab returns', () => {
    expect(evaluateTab(tabOut(elsewhere(), closed()))).toMatchObject({
      verdict: 'follows',
      summary: 'One Tab stop',
    });
  });

  it('follows when Tab skips the shown popup', () => {
    expect(evaluateTab(tabOpen(active('Apple'), elsewhere()))).toMatchObject({
      verdict: 'follows',
      summary: 'Tab skips the popup',
    });
  });

  it('differs when Tab lands on an option', () => {
    expect(evaluateTab(tabOpen(active('Apple'), focusedOption('Apple')))).toMatchObject({
      verdict: 'differs',
      summary: 'Tab lands in the popup',
    });
  });

  it('differs when Shift+Tab does not come back to the combobox', () => {
    expect(evaluateTab(tabOut(elsewhere(), elsewhere('Name')))).toMatchObject({
      verdict: 'differs',
      summary: 'Shift+Tab does not return to the combobox',
    });
  });

  it('differs when Tab stops on the button that opens the popup', () => {
    const openButton: Moment = {
      focus: {
        role: 'button',
        name: 'Open',
        states: { expanded: false },
        isBody: false,
        isInsideComponent: true,
      },
      popup: closed().popup,
    };
    expect(evaluateTab(tabOut(openButton, closed()))).toMatchObject({
      verdict: 'differs',
      summary: 'Tab stops on the open button',
    });
  });

  it('does not judge a stop on another control of the combobox', () => {
    expect(evaluateTab(tabOut(button('Clear'), closed()))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Tab stops on another control',
    });
  });

  it('does not judge a Tab that keeps focus in the combobox', () => {
    expect(evaluateTab(tabOpen(active('Apple'), closed('Apple')))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Tab keeps focus in the combobox',
    });
  });

  it('does not judge Tab from an option that held DOM focus: charged to focus-stays', () => {
    expect(evaluateTab(tabOpen(focusedOption('Apple'), elsewhere()))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Focus was on an option',
    });
  });
});

describe('evaluateExpanded', () => {
  const openDown = (after: Moment) => walk('open-down', closed(), [[down, after]]);

  it('follows when expanded matches whether options are in the tree', () => {
    const input = walk('escape', closed(), [
      [type('a'), open()],
      [down, active('Apple')],
      [escape, closed('a')],
    ]);
    expect(evaluateExpanded(input)).toMatchObject({
      verdict: 'follows',
      reason:
        'The expanded state matched whether options were in the tree after each of the 3 steps judged (0 not judged).',
    });
  });

  it('differs when options are shown and the combobox says collapsed', () => {
    const stuck: Moment = { focus: combobox({ states: { expanded: false } }), popup: popup(fruit) };
    expect(evaluateExpanded(openDown(stuck))).toMatchObject({
      verdict: 'differs',
      reason:
        'After step 1, 3 options were in the tree while the combobox was exposed as collapsed.',
    });
  });

  it('differs when the popup is gone and the combobox still says expanded', () => {
    const stuck: Moment = {
      focus: combobox({ states: { expanded: true } }),
      popup: closed().popup,
    };
    expect(evaluateExpanded(openDown(stuck)).verdict).toBe('differs');
  });

  it('does not judge a listbox with no options: closed and kept, or open and empty', () => {
    const empty: Moment = { focus: combobox({ states: { expanded: false } }), popup: popup([]) };
    expect(evaluateExpanded(openDown(empty))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'No expanded state to read',
    });
  });

  it('does not judge a combobox whose focused input exposes no expanded state', () => {
    const wrapper: Moment = { focus: combobox({ states: {} }), popup: popup(fruit) };
    const input = walk('open-down', { ...closed(), focus: combobox({ states: {} }) }, [
      [down, wrapper],
    ]);
    expect(evaluateExpanded(input).verdict).toBe('inconclusive');
  });

  it('does not judge text that matches nothing', () => {
    const input = walk('no-match', closed(), [[type('z'), open([], 'z')]]);
    expect(evaluateExpanded(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Text matches nothing',
    });
  });
});

describe('evaluateEnter', () => {
  const accept = (beforeEnter: Moment, afterEnter: Moment) =>
    walk('accept', closed(), [
      [type('a'), open()],
      [down, beforeEnter],
      [enter, afterEnter],
    ]);

  it('follows when Enter closes the popup and places the value', () => {
    expect(evaluateEnter(accept(active('Apple'), closed('Apple')))).toMatchObject({
      verdict: 'follows',
      reason: 'Enter closed the popup and put "Apple" in the combobox.',
    });
  });

  it('follows when Enter acts on the value and clears the field', () => {
    expect(evaluateEnter(accept(active('Apple'), closed('')))).toMatchObject({
      verdict: 'follows',
      summary: 'Enter accepts and clears the field',
    });
  });

  it('quotes the description when the accepted value is shown beside an empty input', () => {
    const beside: Moment = {
      ...closed(''),
      focus: { ...closed('').focus, description: 'Apple' },
    };
    expect(evaluateEnter(accept(active('Apple'), beside)).reason).toContain(
      'The input\'s description now reads "Apple".',
    );
  });

  it('differs when the popup stays open', () => {
    expect(evaluateEnter(accept(active('Apple'), active('Apple')))).toMatchObject({
      verdict: 'differs',
      summary: 'Popup stays open after Enter',
    });
  });

  it('differs when the combobox keeps what was typed', () => {
    expect(evaluateEnter(accept(active('Apple'), closed('a')))).toMatchObject({
      verdict: 'differs',
      reason: 'With "Apple" active, Enter closed the popup and the combobox held "a".',
    });
  });

  it('is not judged when no option was active before Enter', () => {
    expect(evaluateEnter(accept(open(), open())).verdict).toBe('inconclusive');
  });
});

describe('evaluateEscape', () => {
  const run = (beforeEscape: Moment, afterEscape: Moment) =>
    walk('escape', closed(), [
      [type('a'), open()],
      [down, beforeEscape],
      [escape, afterEscape],
      [escape, closed()],
    ]);

  it('follows when Escape closes the popup and focus stays', () => {
    expect(evaluateEscape(run(active('Apple'), closed('a')))).toMatchObject({
      verdict: 'follows',
      reason:
        'Escape closed the popup, focus stayed on the combobox, and it kept the text (recorded, not judged).',
    });
  });

  it('differs when the popup stays open', () => {
    expect(evaluateEscape(run(active('Apple'), active('Apple'))).summary).toBe(
      'Popup stays open after Escape',
    );
  });

  it('differs when focus leaves the combobox', () => {
    expect(evaluateEscape(run(active('Apple'), elsewhere()))).toMatchObject({
      verdict: 'differs',
      summary: 'Focus leaves the combobox',
    });
  });

  it('is not judged when the popup was not shown before Escape', () => {
    expect(evaluateEscape(run(closed('a'), closed('a')))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Popup not shown',
    });
  });
});

describe('announcing the suggestions', () => {
  const typed = (heard: readonly string[], after: Moment = open()) =>
    walk('type-then-move', closed(), [[type('a'), after, heard]]);
  const noMatch = (heard: readonly string[]) =>
    walk('no-match', closed(), [[type('z'), closed('z'), heard]]);

  it('say-results follows when something is announced after the key', () => {
    expect(evaluateSayResults(typed(['Suggestions available']))).toMatchObject({
      verdict: 'follows',
      reason:
        'After the key that changed the suggestions, a live region said "Suggestions available".',
    });
  });

  it('say-results differs when nothing is announced', () => {
    expect(evaluateSayResults(typed([])).verdict).toBe('differs');
  });

  // Recorded only: APG lets the popup close, and what a system says then carries neither rule.
  it('neither rule is registered for text that matches nothing', () => {
    expect(evaluateSayResults(noMatch(['No suggestions'])).summary).toBe('Scenario not supported');
    expect(evaluateSayCount(noMatch(['No suggestions'])).summary).toBe('Scenario not supported');
  });

  it('say-results follows a combobox that announces and also makes the first match active', () => {
    expect(evaluateSayResults(typed(['3 results available'], active('Apple'))).verdict).toBe(
      'follows',
    );
  });

  it('say-results is not judged when the typed key makes the first match active', () => {
    expect(evaluateSayResults(typed([], active('Apple')))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Typing makes the first match active',
    });
  });

  // One rule for every pattern since 2026-11-15 (ADR 0003): a text counts as the announcement of
  // a change when it names it and does not appear the same way without it. A region that enters
  // the page with its text is read like any other; until then such a step was not judged.
  const withRegion = (input: ReturnType<typeof typed>, text: string) => ({
    ...input,
    steps: input.steps.map((s) => ({
      ...s,
      insertedRegions: [{ text, politeness: 'polite' as const }],
    })),
  });

  it('a region inserted with its text is judged, and the reason says how it arrived', () => {
    const inserted = withRegion(typed([]), '3 options');
    expect(evaluateSayResults(inserted)).toMatchObject({
      verdict: 'follows',
      reason:
        'After the key that changed the suggestions, a live region said "3 options" (in a region that entered the page already holding its text).',
    });
    expect(evaluateSayCount(inserted).verdict).toBe('follows');
  });

  it('a text that also appears in a step that left the list as it was announces no change', () => {
    const judged = typed(['Fruit list']);
    const unchanged = walk('ends', open(), [[press('ArrowDown'), open(), ['Fruit list']]]);
    const input = { ...judged, recorded: [judged, unchanged] };
    expect(evaluateSayResults(input)).toMatchObject({
      verdict: 'differs',
      summary: 'Change is not announced',
      reason:
        'A live region said "Fruit list". The same text appeared after ArrowDown in [ends], with no change of the suggestions. So it is not counted as an announcement of the change of the suggestions.',
    });
    // Charged once: the count has no message to be read from.
    expect(evaluateSayCount(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Change not announced',
    });
  });

  it('the same text in another step that changed the list does not rule it out', () => {
    const judged = typed(['3 suggestions']);
    const input = { ...judged, recorded: [judged, { ...judged, scenarioId: 'accept' }] };
    expect(evaluateSayResults(input).verdict).toBe('follows');
  });

  it('say-results is not judged when typing shows no suggestions', () => {
    expect(evaluateSayResults(typed([], closed('a')))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Typing shows no suggestions',
    });
  });

  it('say-count follows when the message gives the number, as a digit or a word', () => {
    expect(evaluateSayCount(typed(['3 suggestions'])).verdict).toBe('follows');
    expect(evaluateSayCount(typed(['Three results available'])).verdict).toBe('follows');
  });

  it('say-count differs when the message has no count', () => {
    expect(evaluateSayCount(typed(['Suggestions available']))).toMatchObject({
      verdict: 'differs',
      reason: 'A live region said "Suggestions available"; it does not say the number 3.',
    });
  });

  it('say-count does not read another number as the count', () => {
    expect(evaluateSayCount(typed(['13 suggestions'])).verdict).toBe('differs');
  });

  it('say-count is not judged when nothing is announced: charged to say-results', () => {
    expect(evaluateSayCount(typed([]))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Change not announced',
    });
  });
});
