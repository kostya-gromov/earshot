import type { ReactNode } from 'react';
import type { Pattern, Verdict } from '@earshot/contracts';
import type { RuleAgreement, SystemVerdict } from '@/lib/agreement';
import type { ReplayLane } from '@/lib/replay';
import { scenarioLabelsOf } from '@/lib/scenario-labels';
import { modelCountNote, modelShares, modelsFor } from '@/lib/trade-offs';
import { Keycap } from '@/ui';
import { Agreement } from './agreement';
import { RuleReplay } from './rule-replay';
import { RuleTabs } from './rule-tabs';
import { SourceLinks } from './source-links';
import styles from './depth.module.css';

type CountedVerdicts = Parameters<typeof modelCountNote>[1];

/** What the models of the pattern add to a rule's count: a sentence for drafts, counts for reviewed. */
function modelFacts(pattern: Pattern, ruleId: string, counted: CountedVerdicts) {
  const models = modelsFor(pattern, { ruleId });
  return {
    modelNote: modelCountNote(models, counted),
    modelShares: modelShares(ruleId, models, counted),
  };
}

interface RuleDepthProps {
  pattern: Pattern;
  /** The scenarios that test each rule, as the measurement records them. */
  scenariosByRule: Readonly<Record<string, readonly string[]>>;
  /** The reference first, then the counted systems; recordings and verdicts. */
  lanes: readonly ReplayLane[];
  people: readonly string[];
  agreement: Readonly<Record<string, RuleAgreement>>;
  verdicts: Readonly<Record<string, readonly SystemVerdict[]>>;
  referenceVerdicts: Readonly<Record<string, Verdict>>;
  tradeOffs: (ruleId: string) => ReactNode;
  /** Each system's evidence for a rule, by lane id. */
  details: (ruleId: string) => Readonly<Record<string, ReactNode>>;
  playgroundActions: Readonly<Record<string, ReactNode>>;
}

const notMeasured: RuleAgreement = {
  measured: 0,
  judged: 0,
  follows: 0,
  differs: 0,
  inconclusive: 0,
  notApplicable: 0,
};

/** What the rule asks and at what level; its sources follow the recording (see RuleDepth). */
function RuleHead({ rule }: { rule: Pattern['rules'][number] }) {
  return (
    <header className={styles.head}>
      <div className={styles.ruleKeys}>
        {rule.keys.map((keys) => (
          <Keycap key={keys} keys={keys} />
        ))}
      </div>
      <h3>{rule.title}</h3>
      <p className={styles.level}>
        {rule.level === 'recommendation'
          ? 'Atlas recommendation, beyond what WCAG asks'
          : 'Rule from the standards'}
      </p>
      <p className={styles.description}>{rule.description}</p>
    </header>
  );
}

/** One rule in depth: what it asks and why, every system's recording, trade-offs, evidence. */
export function RuleDepth(props: RuleDepthProps) {
  const { pattern, scenariosByRule, lanes, people, agreement, verdicts, referenceVerdicts } = props;
  const { tradeOffs, details, playgroundActions } = props;
  const tabs = pattern.rules.map((rule) => {
    const scenarios = (scenariosByRule[rule.id] ?? []).map((id) => ({
      id,
      label: scenarioLabelsOf(pattern.id)[id] ?? id,
    }));
    return {
      id: rule.id,
      title: rule.title,
      isRecommendation: rule.level === 'recommendation',
      panel: (
        <article className={styles.rule}>
          <RuleHead rule={rule} />
          {/* The recording right under what the rule asks: it is what the rule looks like. Where
              it comes from and how many systems agree follow it (design review 2026-11-13: the
              recording started 470 px below the title, under four blocks of small text). */}
          {scenarios.length > 0 && (
            <RuleReplay
              ruleId={rule.id}
              scenarios={scenarios}
              lanes={lanes}
              people={people}
              details={details(rule.id)}
              playgroundActions={playgroundActions}
            />
          )}
          <div className={styles.basis}>
            <SourceLinks sources={rule.sources} />
            <Agreement
              agreement={agreement[rule.id] ?? notMeasured}
              verdicts={verdicts[rule.id] ?? []}
              reference={referenceVerdicts[rule.id]}
              {...modelFacts(pattern, rule.id, verdicts[rule.id] ?? [])}
            />
          </div>
          {tradeOffs(rule.id)}
        </article>
      ),
    };
  });
  return <RuleTabs tabs={tabs} initial={pattern.rules[0]?.id ?? ''} />;
}
