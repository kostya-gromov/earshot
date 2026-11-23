import type { Pattern } from '@earshot/contracts';
import type { LoadedMeasurement } from '@/data/measurements';
import { isReference } from '@/lib/agreement';
import { assignDifferences, modelNoteId, modelsFor, ruleTradeOffs } from '@/lib/trade-offs';
import { ModelNote, OtherDifferences, TradeOff, type MeasuredDifference } from './trade-off';
import styles from './evidence.module.css';

/** Differing systems for a rule; those a model note explains are told there, not twice. */
function differencesFor(
  ruleId: string,
  { measured, explained }: { measured: readonly LoadedMeasurement[]; explained: Set<string> },
): MeasuredDifference[] {
  return measured.flatMap(({ measurement }) => {
    const verdict = measurement.verdicts[ruleId];
    if (isReference(measurement) || verdict?.verdict !== 'differs') return [];
    if (explained.has(measurement.target.adapter)) return [];
    const { adapter, system } = measurement.target;
    return [{ adapter, system, summary: verdict.summary }];
  });
}

interface RuleTradeOffsProps {
  pattern: Pattern;
  ruleId: string;
  measured: readonly LoadedMeasurement[];
}

/**
 * "Why systems differ": the rule's alternatives, each with the systems that take it, the
 * differences no alternative describes, then any different model that explains a system's
 * verdicts. One heading says what the block is; one status says whether its texts are reviewed.
 */
export function RuleTradeOffs({ pattern, ruleId, measured }: RuleTradeOffsProps) {
  const tradeOffs = ruleTradeOffs(pattern, ruleId);
  const models = modelsFor(pattern, { ruleId });
  const explained = new Set(models.flatMap(({ seenIn }) => seenIn));
  const { byTradeOff, rest } = assignDifferences(
    tradeOffs,
    differencesFor(ruleId, { measured, explained }),
  );
  const systemName = (adapter: string) =>
    measured.find(({ measurement }) => measurement.target.adapter === adapter)?.measurement.target
      .system ?? adapter;
  if (tradeOffs.length + rest.length + models.length === 0) return null;
  const hasDraft = [...tradeOffs, ...models].some(({ status }) => status === 'draft');
  const hasAlternative =
    models.length + rest.length > 0 || tradeOffs.some(({ kind }) => kind === 'alternative');
  return (
    <div className={styles.tradeGroup}>
      <header className={styles.tradeHead}>
        <h4>Why systems differ</h4>
        {hasDraft && <span className={styles.draft}>Draft, pending review</span>}
        {hasAlternative ? (
          <p>
            Differing is not failing. Each alternative has something it gains, something it costs,
            and a case where it is reasonable. That case is a condition: a system listed beside it
            does not necessarily meet it.
          </p>
        ) : (
          // Only a note: nothing is on record of what the difference gains, and the note says so.
          <p>Differing is not failing. What is on record about the difference is below.</p>
        )}
      </header>
      {tradeOffs.map((tradeOff, index) => (
        <TradeOff
          key={tradeOff.kind === 'alternative' ? tradeOff.alternative : tradeOff.note}
          tradeOff={tradeOff}
          differences={byTradeOff[index] ?? []}
        />
      ))}
      {rest.length > 0 && <OtherDifferences differences={rest} />}
      {models.map((model) => (
        <ModelNote
          key={model.model}
          id={modelNoteId(ruleId, model)}
          model={model}
          systems={model.seenIn.map(systemName)}
        />
      ))}
    </div>
  );
}
