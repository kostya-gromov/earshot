/*
 * The selected names, with no DOM. Keeping the state pure means the rules about what
 * counts as a new name live in one place and can be read without any UI around them.
 */

export type AddResult =
  { status: 'added'; name: string } | { status: 'duplicate'; name: string } | { status: 'empty' };

export type Selection = ReturnType<typeof createSelection>;

const normalize = (raw: string) => raw.trim().replace(/\s+/g, ' ');

export function createSelection(initial: readonly string[]) {
  const names = [...initial];

  return {
    list: (): readonly string[] => [...names],
    count: () => names.length,
    has: (name: string) => names.includes(name),

    /** `raw` is the text as typed or pasted. */
    add(raw: string): AddResult {
      const name = normalize(raw);
      if (!name) return { status: 'empty' };
      if (names.includes(name)) return { status: 'duplicate', name };
      names.push(name);
      return { status: 'added', name };
    },

    /** Returns the removed name. */
    removeAt: (index: number): string | undefined => names.splice(index, 1)[0],
  };
}
