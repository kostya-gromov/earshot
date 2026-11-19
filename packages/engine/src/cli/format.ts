import type { Action, FocusInfo } from '@earshot/contracts';
import type { StepObservation } from '../runner/observe-step.ts';

/* Human-readable debug output. Pure: observations in, text out. */

const describeAction = (action: Action): string => {
  switch (action.type) {
    case 'press':
      return `press ${action.key}`;
    case 'type':
      return `type "${action.text}"`;
    case 'click':
      return `click ${action.target.role ?? '?'} "${action.target.name}"`;
  }
};

export function describeFocus(focus: FocusInfo): string {
  if (focus.isBody) return 'page body (focus lost)';
  const position = focus.posInSet ? ` ${focus.posInSet} of ${focus.setSize}` : '';
  const states = Object.entries(focus.states)
    .map(([state, value]) => (value === true ? state : `${state}=${String(value)}`))
    .join(', ');
  const outside = focus.isInsideComponent ? '' : ' [outside component]';
  const active = focus.activeDescendant
    ? ` → active ${focus.activeDescendant.role} "${focus.activeDescendant.name}"`
    : '';
  return `${focus.role ?? 'no role'} "${focus.name}"${position}${states ? ` (${states})` : ''}${active}${outside}`;
}

export function formatStep(step: StepObservation, index: number): string {
  const heard = step.announcements.length
    ? step.announcements
        .map(
          (a) =>
            `"${a.text}" (${a.politeness}, +${a.at} ms${a.insertedLate ? ', late region' : ''})`,
        )
        .join('; ')
    : '(nothing)';
  return [
    `${index + 1}. ${describeAction(step.action)}   settled in ${step.settle.ms} ms${step.settle.quiet ? '' : ' (CAP HIT)'}`,
    `   focus  ${describeFocus(step.focusBefore)}`,
    `      →   ${describeFocus(step.focusAfter)}`,
    `   heard  ${heard}`,
    `   tree   ${step.axBefore.length} → ${step.axAfter.length} nodes`,
  ].join('\n');
}
