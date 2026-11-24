import type { Rule } from '../schema/index.ts';
import { apg, wcag } from './input-with-chips-sources.ts';

/** The rules and Earshot recommendations for input-with-chips (docs/patterns/input-with-chips.md). */
export const inputWithChipsRules: Rule[] = [
  {
    id: 'chip-stop',
    title: 'The chips are one Tab stop',
    description:
      'From a chip, Tab and Shift+Tab leave the chips, to the input or out of the field: never to another chip, or to a control inside one. The chips are one composite widget with roving focus. Applies when arrow keys move between the chips: chips that are separate controls with no arrow keys are what APG allows outside a composite widget, so the rule does not apply to them, and their extra stops count under “One stop for the whole field”. Measured from the last chip, which the engine focuses directly.',
    keys: ['Tab', 'Shift+Tab'],
    level: 'rule',
    sources: [
      apg.rovingTabindex,
      apg.pillList,
      {
        ...wcag('2.1.1', 'Keyboard', 'keyboard'),
        relation: 'related',
        note: 'Related: 2.1.1 asks that every chip can be used from the keyboard, not for a single Tab stop. The one stop comes from the APG practice above.',
      },
    ],
  },
  {
    id: 'chip-arrows',
    title: 'Arrows move between chips',
    description:
      'From a chip, Left Arrow moves focus to the previous chip and Right Arrow to the next. An Earshot recommendation: APG’s keyboard practice says that arrow keys, not Tab, move focus inside a composite widget, leaves the choice of keys to the author and strongly advises the keys of similar components; it names no keys for a row. In APG’s pill list Left and Right Arrow move through a recipient and its remove icon, not from chip to chip. Does not apply to chips that are separate controls in the tab sequence. Measured from the last chip, which the engine focuses directly.',
    keys: ['ArrowLeft', 'ArrowRight'],
    level: 'recommendation',
    sources: [
      {
        ...apg.rovingTabindex,
        relation: 'related',
        note: 'Related: the practice says that keys other than Tab, “primarily the arrow keys”, move focus inside a composite, and that authors “are free to choose which keys”. It does not name Left and Right Arrow for a row.',
      },
      {
        ...apg.pillList,
        relation: 'related',
        note: 'Related: the example has one Tab stop and arrow keys inside it. Its Left and Right Arrow move through every element, a recipient and then its remove icon; Down and Up Arrow move from recipient to recipient.',
      },
      {
        ...wcag('2.4.3', 'Focus Order', 'focus-order'),
        relation: 'related',
        note: 'Related: 2.4.3 asks that focus moves in an order that keeps meaning, not for arrow keys. Arrow navigation comes from the APG practice above.',
      },
    ],
  },
  {
    id: 'tab',
    title: 'One stop for the whole field',
    description:
      'The input and its chips share one Tab stop: Tab and Shift+Tab from the input leave the field, and so does Tab from a chip. An Earshot recommendation: APG asks for one stop per composite widget, and treating the input and its chips as one widget is our design, so the whole field costs one Tab.',
    keys: ['Tab', 'Shift+Tab'],
    level: 'recommendation',
    sources: [
      {
        ...apg.rovingTabindex,
        relation: 'related',
        note: 'Related: APG asks for one Tab stop per composite widget. That the input and the chips form one widget is Earshot’s design: APG’s own pill list keeps its input separate.',
      },
    ],
  },
  {
    id: 'arrows',
    title: 'Arrows join the input and the chips',
    description:
      'From caret position 0, Left Arrow moves focus to the last chip, and Right Arrow past the last chip returns to the input. An Earshot recommendation: it lets a keyboard user reach the chips without leaving the field; APG does not define this crossing. Moving between chips is the rule above.',
    keys: ['ArrowLeft', 'ArrowRight'],
    level: 'recommendation',
    sources: [
      {
        ...apg.rovingTabindex,
        relation: 'related',
        note: 'Related: APG covers arrow keys within a composite widget, not crossing from a text input into one.',
      },
    ],
  },
  {
    id: 'bsp',
    title: 'Backspace twice to remove',
    description:
      'In an empty input, the first Backspace moves focus to the last chip. The second removes it. An Earshot recommendation: no standard asks for two presses; it makes a removal deliberate and lets a screen reader say which chip is about to go.',
    keys: ['Backspace'],
    level: 'recommendation',
    sources: [
      {
        ...wcag(
          '3.3.4',
          'Error Prevention (Legal, Financial, Data)',
          'error-prevention-legal-financial-data',
        ),
        relation: 'rationale',
        note: 'Cited as rationale. The criterion covers submitted data, not edits inside a field; the two-step removal applies the same idea of making destructive actions deliberate.',
      },
    ],
  },
  {
    id: 'keep-focus',
    title: 'Keep focus in the field after a removal',
    description:
      'After a removal, by key or by clicking a remove button, focus stays in the field: on a neighbouring chip or the input. It never falls to the page body or leaves the field. An Earshot recommendation: APG calls it essential that focus is not lost to the page body when an item is deleted; that focus stays in this field, on a neighbouring chip or the input, is what Earshot adds. The reference returns focus to the input after a click; a neighbouring chip is as good.',
    keys: ['Backspace', 'Delete'],
    level: 'recommendation',
    sources: [
      {
        ...apg.focusPersistence,
        relation: 'related',
        note: 'Related: the practice calls it “essential that there is always a component within the user interface that is active”, and names “deleting an item from a list” as a case where, unmanaged, “browsers move focus to the body element”. It does not ask that focus stays in the same field. The section is marked as work in progress.',
      },
      {
        ...wcag('2.4.3', 'Focus Order', 'focus-order'),
        relation: 'related',
        note: 'Related: 2.4.3 asks that components “receive focus in an order that preserves meaning and operability”; it “does not specify what should or should not receive focus”, so it does not say where focus goes after a removal.',
      },
    ],
  },
  {
    id: 'say',
    title: 'Announce the removal',
    description:
      'A removal is announced through a live region and names the removed value. A text counts as that announcement when it names the value and is not the same text the component puts in a live region in a step that removes nothing; a region that enters the page already holding its text is read the same way. An Earshot recommendation: Earshot reads a chip that disappears as a status message, while WCAG 4.1.3 centres on messages added to the page. In which order a screen reader speaks the announcement and the new focus varies, and the semantic model does not show it.',
    keys: ['Backspace', 'Delete'],
    level: 'recommendation',
    sources: [
      {
        ...wcag('4.1.3', 'Status Messages', 'status-messages'),
        relation: 'related',
        note: 'Related: the criterion asks that status messages reach assistive technology without focus. Whether a disappearing chip is one is a reading, so this is a recommendation.',
      },
    ],
  },
  {
    id: 'count',
    title: 'Say how many remain',
    description:
      'The removal announcement also gives the new number of selected values, for example “2 selected”. An Earshot recommendation: a person who cannot see the field otherwise learns how many remain only by moving through every chip. Judged only where the removal is announced at all.',
    keys: ['Backspace', 'Delete'],
    level: 'recommendation',
    sources: [
      {
        ...wcag('4.1.3', 'Status Messages', 'status-messages'),
        relation: 'related',
        note: 'Related: the criterion does not ask for a count.',
      },
    ],
  },
];
