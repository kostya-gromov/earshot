/*
 * Reference select: APG's select-only combobox, one chosen value, no text input
 * (docs/proposals/select.md). Framework-free; the browser runs this file with types removed.
 * Keys follow the APG select-only example, which is the model for the rules.
 */
import { createListbox, type Listbox } from './listbox.ts';
import { createTypeBuffer, isPrintable, matchIndex } from './typeahead.ts';

export interface SelectOptions {
  options: readonly string[];
  value: string;
}

interface Parts {
  list: Listbox;
  type: (letter: string) => string;
}

type Action = (list: Listbox) => void;

/** One page of options for Page Up and Page Down, as in the APG example. */
const PAGE = 10;

/** While the list is hidden. Down Arrow keeps the chosen option active, as the example does. */
const closedKeys: Readonly<Record<string, Action>> = {
  ArrowDown: (list) => list.open(list.chosenIndex()),
  'Alt+ArrowDown': (list) => list.open(list.chosenIndex()),
  ArrowUp: (list) => list.open(0),
  Enter: (list) => list.open(list.chosenIndex()),
  ' ': (list) => list.open(list.chosenIndex()),
  Home: (list) => list.open(0),
  End: (list) => list.open(list.lastIndex()),
};

/** While the list is shown. Tab is handled apart: it chooses, then the browser moves focus on. */
const openKeys: Readonly<Record<string, Action>> = {
  Enter: (list) => list.choose(),
  ' ': (list) => list.choose(),
  'Alt+ArrowUp': (list) => list.choose(),
  Escape: (list) => list.close(),
  ArrowDown: (list) => list.moveBy(1),
  ArrowUp: (list) => list.moveBy(-1),
  Home: (list) => list.moveTo(0),
  End: (list) => list.moveTo(list.lastIndex()),
  PageDown: (list) => list.moveBy(PAGE),
  PageUp: (list) => list.moveBy(-PAGE),
};

function typeLetter({ list, type }: Parts, letter: string) {
  const from = list.isOpen() ? list.activeIndex() : list.chosenIndex();
  const index = matchIndex(list.options, { typed: type(letter), from });
  // Typing opens the list so the options can be perceived (APG example, accessibility features).
  list.open(index === -1 ? from : index);
}

function onKeydown(parts: Parts, event: KeyboardEvent) {
  const { list } = parts;
  if (event.key === 'Tab') {
    if (list.isOpen()) list.choose(); // no preventDefault: focus moves on as usual
    return;
  }
  const key = (event.altKey ? 'Alt+' : '') + event.key;
  const action = (list.isOpen() ? openKeys : closedKeys)[key];
  if (action) {
    event.preventDefault();
    action(list);
    return;
  }
  if (!isPrintable(event)) return;
  event.preventDefault();
  typeLetter(parts, event.key);
}

export function createSelect(root: HTMLElement, { options, value }: SelectOptions): () => void {
  const select = root.querySelector<HTMLElement>('[role="combobox"]')!;
  const popup = root.querySelector<HTMLElement>('[role="listbox"]')!;
  const label = root.querySelector<HTMLElement>(`#${select.getAttribute('aria-labelledby')}`);
  const controller = new AbortController();
  const { signal } = controller;
  const parts: Parts = {
    list: createListbox({ select, popup, options, value }),
    type: createTypeBuffer(),
  };
  const { list } = parts;

  select.addEventListener('keydown', (event) => onKeydown(parts, event), { signal });
  // A click on the select opens or closes the list; closing keeps the value (APG example).
  select.addEventListener(
    'click',
    () => (list.isOpen() ? list.close() : list.open(list.chosenIndex())),
    {
      signal,
    },
  );
  // Leaving the select sets the value to the active option, as the APG example does.
  select.addEventListener('blur', () => list.isOpen() && list.choose(), { signal });
  popup.addEventListener('mousedown', (event) => event.preventDefault(), { signal }); // focus stays on the select
  popup.addEventListener(
    'click',
    (event) => {
      const option = (event.target as Element).closest('[role="option"]');
      if (!option) return;
      list.moveTo(list.indexOf(option));
      list.choose();
    },
    { signal },
  );
  // A click on the label puts focus on the select, as a label element does for a field.
  label?.addEventListener('click', () => select.focus(), { signal });

  return () => controller.abort();
}
