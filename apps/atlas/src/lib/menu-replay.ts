import type { FocusInfo, PopupState, Step } from '@earshot/contracts';

/**
 * A menu button recording in the terms a replay draws: the button and what it says about being
 * expanded, the items with the active and the disabled one, where focus is, and what the page
 * says its last action was. Every field is what the engine recorded.
 */
export type MenuFocus =
  | { kind: 'button' }
  | { kind: 'item'; index: number; name: string }
  | { kind: 'menu' }
  | { kind: 'outside'; role: string | null; name: string }
  | { kind: 'body' };

export interface MenuItem {
  name: string;
  /** Holding DOM focus, or named by the menu's aria-activedescendant. */
  isActive: boolean;
  isDisabled: boolean;
}

/** `hidden`: the button is not in the accessibility tree. `unstated`: there, with no state. */
export type ButtonState = 'expanded' | 'collapsed' | 'unstated' | 'hidden';

export interface MenuMoment {
  focus: MenuFocus;
  button: ButtonState;
  items: readonly MenuItem[];
  /** The page's own line, written by an item's handler: "Last action: Duplicate". */
  lastAction: string;
}

export interface MenuStep {
  key: string;
  before: MenuMoment;
  after: MenuMoment;
}

function menuFocus(focus: FocusInfo, popup: PopupState): MenuFocus {
  if (focus.isBody) return { kind: 'body' };
  const item = focus.item && popup.options[focus.item.index - 1];
  if (focus.item && item) return { kind: 'item', index: focus.item.index, name: item.name };
  if (focus.isInsidePopup) return { kind: 'menu' };
  if (focus.isInsideComponent) return { kind: 'button' };
  return { kind: 'outside', role: focus.role, name: focus.name };
}

function buttonState({ opener }: PopupState): ButtonState {
  if (!opener) return 'hidden';
  if (opener.states.expanded === undefined) return 'unstated';
  return opener.states.expanded ? 'expanded' : 'collapsed';
}

function activeName(focus: FocusInfo, popup: PopupState): string | undefined {
  if (focus.activeDescendant) return focus.activeDescendant.name;
  return focus.item ? popup.options[focus.item.index - 1]?.name : undefined;
}

interface Parts {
  focus: FocusInfo;
  popup: PopupState;
  lastAction: string;
}

function moment({ focus, popup, lastAction }: Parts): MenuMoment {
  const active = activeName(focus, popup);
  return {
    focus: menuFocus(focus, popup),
    button: buttonState(popup),
    items: popup.options.map(({ name, states }) => ({
      name,
      isActive: name === active,
      isDisabled: states.disabled === true,
    })),
    lastAction,
  };
}

const keyOf = ({ action }: Step): string => {
  switch (action.type) {
    case 'press':
      return action.key;
    case 'type':
      return `“${action.text}”`;
    case 'click':
      return 'Click';
  }
};

/** One run's steps as a menu replay; empty unless every step recorded the menu and the page's line. */
export function menuSteps(steps: readonly Step[]): MenuStep[] {
  if (!steps.every(({ popup, effect }) => popup && effect)) return [];
  return steps.flatMap((step) => {
    if (!step.popup || !step.effect) return [];
    const { popup, effect } = step;
    return [
      {
        key: keyOf(step),
        before: moment({ focus: step.focusBefore, popup: popup.before, lastAction: effect.before }),
        after: moment({ focus: step.focusAfter, popup: popup.after, lastAction: effect.after }),
      },
    ];
  });
}

function focusWords(focus: MenuFocus): string {
  switch (focus.kind) {
    case 'button':
      return 'Focus on the button';
    case 'item':
      return `Focus on item ${focus.index}, “${focus.name}”`;
    case 'menu':
      return 'Focus on the menu itself';
    case 'outside':
      // Where it went is the point of the Tab rule, so it is named.
      return `Focus left the menu button: ${focus.name || focus.role || 'an unnamed control'}`;
    case 'body':
      return 'Focus lost to the page';
  }
}

const buttonWords: Record<ButtonState, string> = {
  expanded: 'The button is exposed as expanded.',
  collapsed: 'The button is exposed as collapsed.',
  unstated: 'The button has no expanded state.',
  hidden: 'The button is not in the accessibility tree.',
};

function menuChange(before: MenuMoment, after: MenuMoment): string[] {
  const [was, now] = [before.items.length, after.items.length];
  if (was === now) return [];
  if (now === 0) return ['The menu closes.'];
  return [`The menu opens with ${now} ${now === 1 ? 'item' : 'items'}.`];
}

const activeOf = ({ items }: MenuMoment) => items.findIndex(({ isActive }) => isActive);

/** The item that became active, with its place; nothing when the active item did not change. */
function activeChange(before: MenuMoment, after: MenuMoment): string[] {
  if (after.items.length === 0) return [];
  const index = activeOf(after);
  const item = after.items[index];
  if (!item) return activeOf(before) === -1 ? ['No item is active.'] : ['No item is active now.'];
  if (before.items[activeOf(before)]?.name === item.name && before.items.length > 0) return [];
  const place = `${index + 1} of ${after.items.length}${item.isDisabled ? ', disabled' : ''}`;
  // Where the active item is the one that holds focus, that is one fact and is said once. The
  // two are told apart only where they differ: a menu that keeps focus and names its item.
  const { focus } = after;
  if (focus.kind === 'item' && focus.name === item.name) {
    return [`Focus on “${item.name}”, ${place}.`];
  }
  return [`“${item.name}” active, ${place}.`];
}

/** Focus moved somewhere the line about the active item has not already said. */
function focusChange(before: MenuMoment, after: MenuMoment): string[] {
  if (JSON.stringify(before.focus) === JSON.stringify(after.focus)) return [];
  const active = after.items[activeOf(after)];
  const isSaid = after.focus.kind === 'item' && after.focus.name === active?.name;
  return isSaid ? [] : [`${focusWords(after.focus)}.`];
}

/**
 * What a step changed, in words, beside the schematic. A step that changed nothing says so: for
 * Enter on a disabled item or Tab that is held in the menu, that is the finding.
 */
export function describeMenuChange({ before, after }: MenuStep): string {
  const changes = [
    ...menuChange(before, after),
    ...activeChange(before, after),
    ...focusChange(before, after),
    ...(before.button === after.button ? [] : [buttonWords[after.button]]),
    ...(before.lastAction === after.lastAction ? [] : [`The page says “${after.lastAction}”.`]),
  ];
  return changes.length > 0 ? changes.join(' ') : 'Nothing changes.';
}

/** The control focus goes to outside the menu button in a recording, by the name recorded. */
export function menuOutside(steps: readonly MenuStep[]): string | undefined {
  const reached = steps.flatMap(({ before, after }) => [before.focus, after.focus]);
  return reached.flatMap((focus) =>
    focus.kind === 'outside' ? [focus.name || focus.role || ''] : [],
  )[0];
}
