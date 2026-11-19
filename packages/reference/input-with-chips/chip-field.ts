/*
 * Input with chips: reference implementation.
 *
 * Built from an APG combobox (typing and suggestions) plus a list of remove buttons with
 * roving focus. Chips are not listbox options, because an option cannot contain a button.
 * Framework-free on purpose. The browser runs this exact code with the type annotations
 * removed (erasable TypeScript only), so what the Atlas page shows is what runs.
 *
 * This file only wires the parts together:
 *   selection.ts    the selected names (no DOM)
 *   chip-list.ts    chips with roving focus
 *   suggestions.ts  the combobox popup
 *   announcer.ts    live region messages
 */
import { createAnnouncer } from './announcer.ts';
import { createChipList, type ChipList } from './chip-list.ts';
import { createSelection, type Selection } from './selection.ts';
import { createSuggestions, type Suggestions } from './suggestions.ts';

export interface ChipFieldOptions {
  /** People selected at start. */
  initial?: readonly string[];
  /** Names offered as suggestions. */
  directory?: readonly string[];
}

/**
 * Enhances the markup from chip-field.html inside `root`. Element ids come from the markup,
 * so a page can host several fields by giving each its own ids.
 */
export function createChipField(
  root: HTMLElement,
  { initial = [], directory = [] }: ChipFieldOptions = {},
): { destroy: () => void } {
  const parts = queryParts(root);
  // One controller removes every listener, so the playground can remount cleanly.
  const controller = new AbortController();
  const { signal } = controller;
  const selection = createSelection(initial);
  const announce = createAnnouncer(parts.status);

  const chips = createChipList({
    list: parts.chipList,
    signal,
    onExit: () => parts.input.focus(),
    onRemove(index, source) {
      const name = selection.removeAt(index);
      const next = Math.min(index, selection.count() - 1);
      // Keyboard removal stays among the chips; otherwise focus returns to the input, never <body>.
      const stayInChips = source === 'keyboard' && next >= 0;
      chips.render(selection.list(), stayInChips ? next : null);
      if (!stayInChips) parts.input.focus();
      announce(`${name} removed. ${selection.count()} selected`);
    },
  });

  function add(raw: string) {
    const result = selection.add(raw);
    if (result.status === 'duplicate') announce(`${result.name} is already added`);
    if (result.status !== 'added') return;
    chips.render(selection.list());
    announce(`${result.name} added. ${selection.count()} selected`);
  }

  function commit(raw: string) {
    add(raw);
    parts.input.value = '';
    suggestions.close();
  }

  const suggestions = createSuggestions({
    input: parts.input,
    popup: parts.popup,
    candidates: () => directory.filter((name) => !selection.has(name)),
    onPick: commit,
    signal,
  });

  bindInputKeys({
    input: parts.input,
    signal,
    keys: inputKeyActions({ input: parts.input, chips, suggestions, selection, commit }),
  });
  bindFieldEvents({ ...parts, signal, add });
  chips.render(selection.list());

  return { destroy: () => controller.abort() };
}

interface KeyContext {
  input: HTMLInputElement;
  chips: ChipList;
  suggestions: Suggestions;
  selection: Selection;
  commit: (raw: string) => void;
}

/** Returns true when it handled the key, so the default (typing, caret movement) is prevented only then. */
type KeyHandler = () => boolean;

/** What each key does in the input. */
function inputKeyActions({ input, chips, suggestions, selection, commit }: KeyContext) {
  const isEmpty = () => input.value === '';
  const caretAtStart = () => input.selectionStart === 0 && input.selectionEnd === 0;
  const toLastChip = () => {
    chips.focusLast();
    return true;
  };
  const accept = () => {
    if (!input.value.trim()) return false;
    commit(suggestions.activeName() ?? input.value);
    return true;
  };

  const actions: Partial<Record<string, KeyHandler>> = {
    ArrowDown: () => suggestions.move(1),
    ArrowUp: () => suggestions.move(-1),
    Enter: accept,
    ',': accept,
    Escape() {
      if (suggestions.isOpen()) suggestions.close();
      else if (!isEmpty()) input.value = '';
      else return false;
      return true;
    },
    // Two-step removal: the first Backspace only moves focus to the last chip.
    Backspace: () => isEmpty() && selection.count() > 0 && toLastChip(),
    ArrowLeft: () => caretAtStart() && selection.count() > 0 && toLastChip(),
  };
  return actions;
}

function bindInputKeys(options: {
  input: HTMLInputElement;
  signal: AbortSignal;
  keys: Partial<Record<string, KeyHandler>>;
}) {
  const { input, signal, keys } = options;
  input.addEventListener(
    'keydown',
    (e) => {
      if (keys[e.key]?.()) e.preventDefault();
    },
    { signal },
  );
}

function bindFieldEvents(options: {
  input: HTMLInputElement;
  box: HTMLElement;
  signal: AbortSignal;
  add: (raw: string) => void;
}) {
  const { input, box, signal, add } = options;
  input.addEventListener(
    'paste',
    (e) => {
      const text = e.clipboardData?.getData('text') ?? '';
      if (!/[,;\n]/.test(text)) return; // single value: normal paste
      e.preventDefault();
      text.split(/[,;\n]/).forEach(add);
    },
    { signal },
  );
  // Clicking the empty part of the box focuses the input, like a native text field.
  box.addEventListener(
    'click',
    (e) => {
      if (e.target === e.currentTarget) input.focus();
    },
    { signal },
  );
}

function queryParts(root: HTMLElement) {
  return {
    input: query(root, '[role="combobox"]', HTMLInputElement),
    chipList: query(root, '.chip-field__chips', HTMLElement),
    popup: query(root, '[role="listbox"]', HTMLElement),
    status: query(root, '[role="status"]', HTMLElement),
    box: query(root, '.chip-field__box', HTMLElement),
  };
}

/** Finds a required part and checks its type, so a broken markup fails loudly at startup. */
function query<T extends HTMLElement>(
  root: ParentNode,
  selector: string,
  type: abstract new () => T,
): T {
  const element = root.querySelector(selector);
  if (!(element instanceof type)) throw new Error(`chip-field: missing ${selector}`);
  return element;
}
