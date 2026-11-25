import type { Step } from '@earshot/contracts';

/** The key a replay shows for a step: the key pressed, a click, or a typed character. */
export const stepKey = ({ action }: Step): string => {
  switch (action.type) {
    case 'press':
      return action.key;
    case 'click':
      return 'Click';
    case 'type':
      // One typed character is shown as its key; longer text as the act of typing.
      return action.text.length === 1 ? action.text : 'Type';
  }
};
