/**
 * The six options every combobox target is measured with (docs/patterns/combobox.md, Scenarios).
 * "a" matches the first three by prefix and by substring alike, and "z" matches none, so the
 * filter a system uses does not change what is judged.
 */
export const fruit = ['Apple', 'Apricot', 'Avocado', 'Cherry', 'Kiwi', 'Plum'] as const;
