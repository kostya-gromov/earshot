import { describeComboboxChange } from './combobox-replay';
import { describeMenuChange } from './menu-replay';
import type { ReplayStep } from './replay';
import { describeTabsChange } from './tabs-replay';

// What a recorded step did, in words, for the text that stands beside every schematic. Apart from
// replay.ts, which turns a recording into steps: the words change for other reasons.

/** A step in a field of chips, in words: who was removed and where focus went. */
function describeFieldStep(step: ReplayStep): string {
  const removal = step.removed.length > 0 ? `${step.removed.join(', ')} removed. ` : '';
  const { to } = step;
  switch (to.kind) {
    case 'chip':
      return `${removal}Focus on chip ${to.index} of ${to.count}`;
    case 'input':
      return `${removal}Focus in the input`;
    case 'outside':
      return `${removal}Focus left the field`;
    case 'body':
      return `${removal}Focus lost to the page`;
    case 'other':
      return `${removal}Focus on ${to.role ?? 'an element'} “${to.name}”`;
  }
}

/** What happened in a step, in words, for the text that stands beside every schematic. */
export function describeStep(step: ReplayStep): string {
  if (step.tabs) return describeTabsChange(step.tabs);
  if (step.menu) return describeMenuChange(step.menu);
  if (step.combobox) return describeComboboxChange(step.combobox);
  return describeFieldStep(step);
}
