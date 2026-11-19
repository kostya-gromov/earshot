/** The same people the reference demo page starts with, so the playground matches the engine's runs. */
export const initialPeople = ['Irene Oh', 'Greg Fisher', 'Hiroshi Matsui'] as const;

export const directory = [
  'Irene Oh',
  'Greg Fisher',
  'Hiroshi Matsui',
  'Ana Lima',
  'Ben Carter',
  'Dana Kowalska',
  'Elif Demir',
  'Marta Nowak',
] as const;

/**
 * The people a pattern's replays draw as chips. Only input with chips has any: a pattern with a
 * popup draws its list from the recording itself.
 */
export const peopleOf = (patternId: string): readonly string[] =>
  patternId === 'input-with-chips' ? initialPeople : [];
