import type { TourRuleId } from './chips-tour';
import type { TourStep } from './tour';

/** What to try in the playground for each rule of input-with-chips (D1a copy). */
export const chipsTourSteps: readonly (TourStep & { id: TourRuleId })[] = [
  { id: 'tab', keys: ['Tab'], task: 'Leave the field with one Tab, from the input or from a chip' },
  {
    id: 'bsp',
    keys: ['Backspace', 'Backspace'],
    task: 'In the empty input, press Backspace twice',
  },
  {
    id: 'arrows',
    keys: ['ArrowLeft', 'ArrowRight'],
    task: 'Step into the chips with Left Arrow, back out with Right Arrow',
  },
  { id: 'say', keys: [], task: 'Type “ma”, press Down Arrow and Enter, and listen' },
];
