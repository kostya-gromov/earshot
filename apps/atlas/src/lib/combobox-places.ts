import type { ComboboxStep } from './combobox-replay';

/**
 * The places focus goes to in a recording besides the combobox and its options, by the names
 * the recording gives them: a control of the combobox itself (the button that opens the list),
 * and the next control on the page. A replay keeps room for them from its first frame.
 */
export interface ComboboxPlaces {
  inside: string | undefined;
  outside: string | undefined;
}

export function comboboxPlaces(steps: readonly ComboboxStep[]): ComboboxPlaces {
  const reached = steps.flatMap(({ before, after }) => [before.focus, after.focus]);
  const nameOf = (kind: 'other' | 'outside') =>
    reached.flatMap((focus) => (focus.kind === kind ? [focus.name || focus.role || ''] : []))[0];
  return { inside: nameOf('other'), outside: nameOf('outside') };
}
