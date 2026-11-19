import { describe, expect, it } from 'vitest';
import type { Pattern, Rule, Source } from '@earshot/contracts';
import { citedPages, ruleLevels } from '../../src/lib/cited-sources';

const APG = 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/';
const UNDERSTANDING = 'https://www.w3.org/WAI/WCAG22/Understanding/';
const FOCUS_ORDER = { sc: '2.4.3', title: 'Focus Order', url: `${UNDERSTANDING}focus-order.html` };
const NAME_ROLE = {
  sc: '4.1.2',
  title: 'Name, Role, Value',
  url: `${UNDERSTANDING}name-role-value.html`,
};

const apg = (fragment = '', relation?: Source['relation']): Source => ({
  kind: 'apg',
  title: 'Combobox Pattern: keyboard interaction',
  url: `${APG}${fragment}`,
  checkedAt: '2026-11-01',
  ...(relation && { relation, note: 'Why it is cited.' }),
});

interface WcagPage {
  sc: string;
  title: string;
  url: string;
}

const wcag = ({ sc, title, url }: WcagPage, relation?: Source['relation']): Source => ({
  kind: 'wcag',
  sc,
  title: `Understanding SC ${sc}: ${title}`,
  url,
  checkedAt: '2026-11-01',
  ...(relation && { relation, note: 'Why it is cited.' }),
});

const rule = (id: string, sources: Source[], level: Rule['level'] = 'rule'): Rule => ({
  id,
  title: id,
  description: id,
  keys: ['Tab'],
  level,
  sources,
});

// Only the fields these functions read; the rest of a pattern does not bear on them.
const pattern = (id: string, name: string, rules: Rule[]) =>
  ({ id, name, rules }) as unknown as Pattern;

describe('citedPages', () => {
  it('counts a rule once when it points at two parts of one page', () => {
    const pages = citedPages([
      pattern('combobox', 'Combobox', [rule('arrows', [apg('#keyboard'), apg('#roles')])]),
    ]);
    expect(pages).toEqual([
      expect.objectContaining({ url: APG, applied: 1, related: 0, patterns: ['Combobox'] }),
    ]);
  });

  it('does not also count as related a rule that applies the page', () => {
    const pages = citedPages([
      pattern('combobox', 'Combobox', [
        rule('arrows', [apg('#keyboard'), apg('#roles', 'related')]),
        rule('escape', [apg('#keyboard', 'rationale')]),
      ]),
    ]);
    expect(pages[0]).toMatchObject({ applied: 1, related: 1 });
  });

  it('names each citing pattern once, in the order the patterns come', () => {
    const pages = citedPages([
      pattern('input-with-chips', 'Input with chips', [
        rule('a', [wcag(FOCUS_ORDER)]),
        rule('b', [wcag(FOCUS_ORDER)]),
      ]),
      pattern('combobox', 'Combobox', [rule('a', [wcag(FOCUS_ORDER)])]),
    ]);
    expect(pages[0]).toMatchObject({ applied: 3, patterns: ['Input with chips', 'Combobox'] });
  });

  it('lists APG before WCAG, then the most applied first, then by criterion number', () => {
    const pages = citedPages([
      pattern('combobox', 'Combobox', [
        rule('a', [wcag(NAME_ROLE, 'related')]),
        rule('b', [wcag(FOCUS_ORDER, 'related')]),
        rule('c', [apg('#keyboard', 'related')]),
      ]),
    ]);
    expect(pages.map(({ label }) => label)).toEqual([
      'APG: Combobox Pattern',
      'WCAG 2.4.3 Focus Order',
      'WCAG 4.1.2 Name, Role, Value',
    ]);
  });

  it('ignores requirements for design: it counts measured behavior only', () => {
    const withRequirement = {
      ...pattern('combobox', 'Combobox', []),
      requirements: [{ sources: [wcag(FOCUS_ORDER)] }],
    } as unknown as Pattern;
    expect(citedPages([withRequirement])).toEqual([]);
  });
});

describe('citedPages and recommendations', () => {
  // Verdict audit 2026-11-18: two recommendations citing APG pages directly were counted as
  // rules applying them, beside a text that says 16 rules come from the standards.
  it('never counts a recommendation as applying a page, however it cites it', () => {
    const pages = citedPages([
      pattern('menu-button', 'Menu button', [
        rule('open', [apg('#keyboard')]),
        rule('disabled', [apg('#keyboard')], 'recommendation'),
        rule('focus-returns', [apg('#roles', 'related')], 'recommendation'),
      ]),
    ]);
    expect(pages[0]).toMatchObject({ applied: 1, related: 0, recommendations: 2 });
  });
});

describe('ruleLevels', () => {
  it('counts rules from the standards apart from the recommendations Atlas adds', () => {
    const levels = ruleLevels([
      pattern('input-with-chips', 'Input with chips', [
        rule('a', []),
        rule('b', [], 'recommendation'),
      ]),
      pattern('combobox', 'Combobox', [rule('a', [])]),
    ]);
    expect(levels).toEqual({ rules: 2, recommendations: 1 });
  });
});
