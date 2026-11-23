import type { Action, FocusInfo, Measurement, Step } from '@earshot/contracts';
import { menuOutcomeParts } from './menu-contract';

/** `action` is the key or click of a step; on a narrow screen its outcome goes on the next line. */
export type ContractPartKind = 'plain' | 'action' | 'comment' | 'focus' | 'heard';
export interface ContractPart {
  text: string;
  kind: ContractPartKind;
}
export type ContractLine = ContractPart[];

const quote = (text: string) => `“${text}”`;
const plain = (text: string): ContractPart => ({ text, kind: 'plain' });

function actionText(action: Action): string {
  switch (action.type) {
    case 'press':
      return `press ${action.key}`;
    case 'click':
      return `click ${quote(action.target.name)}`;
    case 'type':
      return `type ${quote(action.text)}`;
  }
}

function focusParts(focus: FocusInfo): ContractPart[] {
  if (focus.leftPage) return [plain('focus leaves the page')];
  if (focus.isBody) return [plain('focus falls to the document')];
  if (!focus.isInsideComponent) return [plain('focus leaves the field')];
  const position =
    focus.posInSet === undefined ? '' : `, ${focus.posInSet} of ${focus.setSize ?? '?'}`;
  return [
    plain(`focus ${focus.role ?? 'element'} `),
    { text: quote(focus.name), kind: 'focus' },
    plain(position),
  ];
}

/**
 * For a pattern with a popup, focus staying in the field is the one thing that never changes, so
 * a step says what did: whether the list is shown, which option is active, a new value.
 */
function popupParts(step: Step, popup: NonNullable<Step['popup']>): ContractPart[] {
  const { options, present } = popup.after;
  const count = `${options.length} ${options.length === 1 ? 'option' : 'options'}`;
  const parts = [plain(present ? `list open, ${count}` : 'list closed')];
  const active = step.focusAfter.activeDescendant;
  if (active) {
    const index = options.findIndex(({ name }) => name === active.name);
    const position = index === -1 ? '' : `, ${index + 1} of ${options.length}`;
    parts.push(plain(', active '), { text: quote(active.name), kind: 'focus' }, plain(position));
  }
  const { value } = step.focusAfter;
  if (value !== undefined && value !== step.focusBefore.value) {
    parts.push(plain(`, value ${quote(value)}`));
  }
  return parts;
}

/** What a step led to: the popup's state while focus stays in the field, else where focus went. */
function outcomeParts(step: Step): ContractPart[] {
  // A menu button says its own things: the active item, where focus is, what the page says ran.
  const menu = menuOutcomeParts(step);
  if (menu) return menu;
  // Coming back into the field is a move of focus too, and is said as one.
  const staysInField = step.focusBefore.isInsideComponent && step.focusAfter.isInsideComponent;
  return step.popup && staysInField ? popupParts(step, step.popup) : focusParts(step.focusAfter);
}

function stepLine(step: Step): ContractLine {
  return [
    { text: `  ${actionText(step.action).padEnd(28)}`, kind: 'action' },
    plain('→ '),
    ...outcomeParts(step),
    ...step.announcements.flatMap(({ text }) => [
      plain('  says '),
      { text: quote(text), kind: 'heard' as const },
    ]),
  ];
}

/** Said once for a pattern with a popup, in place of the same focus line on every step. */
function popupNote(measurement: Measurement): ContractLine[] {
  const hasPopup = measurement.scenarios.some((scenario) => {
    const run = scenario.runs[0];
    // Not for a menu button, whose focus moves into the menu: its steps say where focus is.
    const stays = (step: Step) => step.popup !== undefined && step.effect === undefined;
    return run?.status === 'completed' && run.steps.some(stays);
  });
  return hasPopup
    ? [[{ text: '# focus stays in the field unless a step says where it went', kind: 'comment' }]]
    : [];
}

/**
 * The behavior contract as plain lines, built from the reference measurement's first run of
 * every scenario: the same steps the engine runs against every target.
 */
export function behaviorContract(measurement: Measurement): ContractLine[] {
  const engine =
    measurement.provenance.status === 'measured'
      ? `, engine ${measurement.provenance.engineVersion}`
      : '';
  const lines: ContractLine[] = [
    [{ text: `# ${measurement.pattern}: built from reference.json${engine}`, kind: 'comment' }],
    [plain(`given  ${measurement.scenarios[0]?.initialState ?? ''}`)],
    ...popupNote(measurement),
    [],
  ];
  for (const scenario of measurement.scenarios) {
    const run = scenario.runs[0];
    lines.push([
      plain(`scenario ${scenario.id}  `),
      { text: `# rules: ${scenario.rules.join(', ')}`, kind: 'comment' },
    ]);
    if (run?.status === 'completed') lines.push(...run.steps.map(stepLine));
    lines.push([]);
  }
  return lines;
}
