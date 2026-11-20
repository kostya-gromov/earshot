import { describe, expect, it } from 'vitest';
import { Source, patterns, patternsInProgress } from '../src/index.ts';

const page = {
  kind: 'wcag',
  sc: '2.4.3',
  title: 'Understanding SC 2.4.3: Focus Order',
  url: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-order',
  checkedAt: '2026-11-16',
};

describe('a source cited as related or as rationale', () => {
  it('must say why in a note', () => {
    expect(Source.safeParse({ ...page, relation: 'related' }).success).toBe(false);
    expect(Source.safeParse({ ...page, relation: 'related', note: 'Related: why.' }).success).toBe(
      true,
    );
  });

  it('is not implied by a note: a note may only say where on the page to look', () => {
    const parsed = Source.parse({ ...page, note: 'The keyboard table.' });
    expect(parsed.relation).toBeUndefined();
  });
});

describe('the sources of every rule', () => {
  const sources = [...Object.values(patterns), ...Object.values(patternsInProgress)].flatMap(
    (pattern) => pattern.rules.flatMap((rule) => rule.sources),
  );

  // The words a reader sees and the field the site sorts by must not drift apart.
  it('say "Related" or "Cited as rationale" in the note exactly when the field says so', () => {
    for (const { note = '', relation, title } of sources) {
      const said = /^Related\b/.test(note)
        ? 'related'
        : /^Cited as rationale\b/.test(note)
          ? 'rationale'
          : undefined;
      expect(`${title}: ${relation}`).toBe(`${title}: ${said}`);
    }
  });

  // Nineteen since 2026-11-19: tabs cites the practice on selection following focus and 4.1.2 as related.
  it('mark nineteen citations as not applied directly', () => {
    expect(sources.filter(({ relation }) => relation !== undefined)).toHaveLength(19);
  });
});
