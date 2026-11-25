import type { AccessibleNode, FocusInfo, PopupState, Step } from '@earshot/contracts';
import { keyOf, moment, type ComboboxFocus, type ComboboxStep } from './combobox-replay';

/**
 * A select recording in the terms the combobox replay draws (docs/proposals/select.md): the same
 * list and marks, with a field that shows the select's value and holds no caret. The value is the
 * one the tree gives the select (engine 0.21.0), never the text of a focused field.
 */

/** Focus is on the select: the role and name the tree gives it, as the evaluators judge it. */
function isOnSelect(focus: FocusInfo, opener: AccessibleNode | undefined): boolean {
  if (focus.item) return false;
  if (!opener) return focus.role === 'combobox' && focus.isInsideComponent;
  return focus.role === opener.role && focus.name === opener.name;
}

function selectFocus(focus: FocusInfo, popup: PopupState, base: ComboboxFocus): ComboboxFocus {
  if (base.kind === 'away' || base.kind === 'body' || base.kind === 'option') return base;
  if (isOnSelect(focus, popup.opener)) return { kind: 'select' };
  // DOM focus on the list, which names its active option (Chakra UI, 2026-11-24).
  if (focus.role === 'listbox') return { kind: 'list' };
  return base;
}

/** What the tree gave the select at one moment: its value or description, or that it was absent. */
function selectFacts(popup: PopupState) {
  const { opener } = popup;
  if (!opener) return { value: undefined, isOutOfTree: true as const };
  const value = opener.treeValue === '' ? undefined : opener.treeValue;
  if (value !== undefined || !opener.description) return { value };
  return { value, description: opener.description };
}

function selectMoment(focus: FocusInfo, popup: PopupState) {
  const { value, ...facts } = selectFacts(popup);
  const base = moment({ focus, popup, value });
  return {
    ...base,
    ...facts,
    focus: selectFocus(focus, popup, base.focus),
    isSelect: true as const,
  };
}

/** One run's steps as a select replay. Steps recorded without a popup are left out. */
export function selectSteps(steps: readonly Step[]): ComboboxStep[] {
  return steps.flatMap((step) => {
    if (!step.popup) return [];
    return [
      {
        key: keyOf(step),
        before: selectMoment(step.focusBefore, step.popup.before),
        after: selectMoment(step.focusAfter, step.popup.after),
        speech: step.speech,
        written: step.announcements.map(({ text }) => text),
        inserted: (step.insertedRegions ?? []).map(({ text }) => text),
      },
    ];
  });
}
