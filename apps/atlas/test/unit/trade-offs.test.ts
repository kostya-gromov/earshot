import { describe, expect, it } from 'vitest';
import { combobox, inputWithChips, menuButton, type Scenario } from '@earshot/contracts';
import {
  modelShares,
  assignDifferences,
  hasUnpositionedChip,
  modelCountNote,
  modelsFor,
  ruleTradeOffs,
} from '../../src/lib/trade-offs';

describe('trade-offs for a rule', () => {
  it('finds the per-rule trade-off and the models that cover the rule', () => {
    expect(ruleTradeOffs(inputWithChips, 'chip-stop').map((t) => t.kind)).toEqual(['alternative']);
    // Separate remove buttons are not one widget (ADR 0009, 2026-11-11): their alternative is under tab.
    expect(
      ruleTradeOffs(inputWithChips, 'tab').some(
        (t) => t.kind === 'alternative' && (t.seenIn?.includes('atlassian') ?? false),
      ),
    ).toBe(true);
    expect(modelsFor(inputWithChips, { ruleId: 'tab' }).map((m) => m.seenIn)).toEqual([
      ['react-aria'],
    ]);
    expect(modelsFor(inputWithChips, { ruleId: 'say' })).toEqual([]);
  });

  it('narrows models to one system', () => {
    expect(modelsFor(inputWithChips, { ruleId: 'arrows', adapter: 'react-aria' })).toHaveLength(1);
    expect(modelsFor(inputWithChips, { ruleId: 'arrows', adapter: 'mui' })).toEqual([]);
  });
});

const scenarioWith = (focus: Record<string, unknown>) =>
  ({
    id: 'arrows',
    rules: ['arrows'],
    initialState: 'x',
    runs: [
      {
        status: 'completed',
        steps: [
          {
            focusAfter: {
              role: 'button',
              name: 'A',
              states: {},
              isBody: false,
              isInsideComponent: true,
              ...focus,
            },
          },
        ],
      },
    ],
  }) as unknown as Scenario;

describe('a model named for a system that follows the rule', () => {
  // MUI's open menu is modal, like React Aria's, yet its Tab closes the menu: it follows `tab`.
  const tab = (adapter: string, verdict: string) =>
    modelsFor(menuButton, { ruleId: 'tab', adapter, verdict });

  it('explains a difference and a rule that could not be judged, never a rule that is followed', () => {
    expect(tab('react-aria', 'differs')).toHaveLength(1);
    expect(tab('mui', 'follows')).toEqual([]);
    expect(
      modelsFor(menuButton, { ruleId: 'expanded', adapter: 'mui', verdict: 'inconclusive' }),
    ).toHaveLength(1);
  });

  it('is counted beside a rule only for the systems whose difference it explains', () => {
    const verdicts = [
      { adapter: 'react-aria', system: 'React Aria', verdict: 'differs' },
      { adapter: 'mui', system: 'MUI', verdict: 'follows' },
      { adapter: 'chakra', system: 'Chakra UI', verdict: 'differs' },
    ];
    const shares = modelShares('tab', modelsFor(menuButton, { ruleId: 'tab' }), verdicts);
    expect(shares.map(({ count }) => count)).toEqual([1]);
  });
});

describe('hasUnpositionedChip', () => {
  it('is true when a located chip had focus without a set position', () => {
    expect(hasUnpositionedChip([scenarioWith({ item: { index: 3, count: 3 } })])).toBe(true);
  });

  it('is false when the chip exposed its position, or focus was not on a chip', () => {
    expect(
      hasUnpositionedChip([
        scenarioWith({ item: { index: 3, count: 3 }, posInSet: 3, setSize: 3 }),
      ]),
    ).toBe(false);
    expect(hasUnpositionedChip([scenarioWith({})])).toBe(false);
  });
});

describe('assignDifferences', () => {
  const differs = (adapter: string) => ({ adapter });

  it('files each difference under the alternative that names its system', () => {
    const tab = ruleTradeOffs(inputWithChips, 'tab');
    const { byTradeOff, rest } = assignDifferences(tab, [differs('atlassian'), differs('fluent')]);
    // Since 2026-11-11 (ADR 0009) Atlassian's separate buttons have their alternative under tab.
    expect(byTradeOff).toEqual([[differs('atlassian')], [differs('fluent')]]);
    expect(rest).toEqual([]);
  });

  it('keeps differences no alternative describes apart', () => {
    // bsp has two alternatives since 2026-11-13: one names Atlassian and MUI, one names Primer
    // (there the first Backspace returns the value to the input as text). A system neither
    // names stays apart.
    const bsp = ruleTradeOffs(inputWithChips, 'bsp');
    const { byTradeOff, rest } = assignDifferences(bsp, [
      differs('atlassian'),
      differs('primer'),
      differs('fluent'),
    ]);
    expect(byTradeOff).toEqual([[differs('atlassian')], [differs('primer')]]);
    expect(rest).toEqual([differs('fluent')]);
  });

  it('puts every difference under an alternative that names no systems', () => {
    const bsp = ruleTradeOffs(inputWithChips, 'bsp');
    expect(assignDifferences(bsp, [differs('mui')])).toEqual({
      byTradeOff: [[differs('mui')], []],
      rest: [],
    });
  });
});

// Verdict audit 2026-11-11 (M1): one deliberate design differs on three rules. Each verdict is
// factual, so it stays; the count says that one design explains them together.
describe('modelCountNote', () => {
  // The sentence is for a model that is still a draft; a reviewed one is said as a count.
  const tab = modelsFor(inputWithChips, { ruleId: 'tab' }).map((model) => ({
    ...model,
    status: 'draft' as const,
  }));

  it('names the systems a model explains and how many rules it covers', () => {
    expect(
      modelCountNote(tab, [
        { adapter: 'react-aria', system: 'React Aria', verdict: 'differs' },
        { adapter: 'fluent', system: 'Fluent 2', verdict: 'differs' },
      ]),
    ).toBe(
      'React Aria differs here by one design, the selected values as a separate grid after the input, which explains its differences on 3 rules together.',
    );
  });

  it('leaves a reviewed model to its own count and says no sentence for it', () => {
    const selected = modelsFor(combobox, { ruleId: 'selected' });
    expect(
      modelCountNote(selected, [{ adapter: 'mui', system: 'MUI', verdict: 'differs' }]),
    ).toBeUndefined();
  });

  it('says nothing when the model’s system does not differ on this rule', () => {
    expect(
      modelCountNote(tab, [{ adapter: 'react-aria', system: 'React Aria', verdict: 'follows' }]),
    ).toBeUndefined();
    expect(modelCountNote([], [])).toBeUndefined();
  });
});

// Design review 2026-11-14: "1 of 5 follow" stood alone in ink while the fact that four systems
// share one design was a grey sentence under it.
describe('modelShares', () => {
  const counted = [
    { adapter: 'chakra', system: 'Chakra UI', verdict: 'differs' },
    { adapter: 'fluent', system: 'Fluent 2', verdict: 'differs' },
    { adapter: 'primer', system: 'GitHub Primer', verdict: 'follows' },
    { adapter: 'mui', system: 'MUI', verdict: 'differs' },
    { adapter: 'react-aria', system: 'React Aria', verdict: 'differs' },
  ];

  it('counts the judged systems a reviewed model names, with a link to its card', () => {
    const selected = modelsFor(combobox, { ruleId: 'selected' });
    expect(modelShares('selected', selected, counted)).toEqual([
      { count: 4, href: '#ev-selected-model-mui-react-aria-chakra-fluent-atlassian' },
    ]);
  });

  it('does not count a system that was not judged', () => {
    const selected = modelsFor(combobox, { ruleId: 'selected' });
    const withUnjudged = counted.map((v) =>
      v.adapter === 'mui' ? { ...v, verdict: 'inconclusive' } : v,
    );
    expect(modelShares('selected', selected, withUnjudged)[0]?.count).toBe(3);
  });

  it('says nothing for a draft model: a count is a statement', () => {
    const tab = modelsFor(inputWithChips, { ruleId: 'tab' }).map((model) => ({
      ...model,
      status: 'draft' as const,
    }));
    expect(
      modelShares('tab', tab, [
        { adapter: 'react-aria', system: 'React Aria', verdict: 'differs' },
      ]),
    ).toEqual([]);
  });
});
