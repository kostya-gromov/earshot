import type { ReactNode } from 'react';
import type { Action, Observation, Scenario, TargetEntry } from '@earshot/contracts';
import type { LoadedMeasurement } from '@/data/measurements';
import { hasUnpositionedChip, modelNoteId, type ModelTradeOff } from '@/lib/trade-offs';
import { measuredOn } from '@/lib/measured-on';
import { scenariosForRule } from '@/lib/verdict-reasons';
import { EvidenceLinks, EvidenceProvenance, VariantProvenance } from './evidence-provenance';
import { InlineCode } from './inline-code';
import styles from './evidence.module.css';

/** A recorded step as the playground replays it; one typed character is replayed as typed. */
function playgroundKey(action: Action): string | undefined {
  switch (action.type) {
    case 'press':
      return action.key;
    case 'click':
      return `Click “${action.target.name}”`;
    case 'type':
      return action.text.length === 1 ? action.text : undefined;
  }
}

/** The keys of a scenario's first completed run, for "Replay in playground"; none if it types a word. */
export function playgroundKeys(scenario: Scenario): string[] | undefined {
  const run = scenario.runs[0];
  if (run?.status !== 'completed') return undefined;
  const keys = run.steps.map(({ action }) => playgroundKey(action));
  return keys.every((key) => key !== undefined) ? keys : undefined;
}

type Demo = Extract<TargetEntry, { status: 'measured' }>;

/** Where a note comes from, as the reader sees it. One label per note, never one for the block. */
const observedAs: Readonly<Record<Observation['source'], string>> = {
  recorded: 'Recorded by the engine',
  seen: 'Seen by hand on the measured page',
  screenshots: 'Seen in screenshots of the measured page, before and after each key',
  script: 'Seen with a script on the measured page, outside the engine',
  'package-source': 'Read in the package source',
  docs: 'Read in the system’s docs',
};

/**
 * What a reader should know about the component beside this rule: behavior the verdicts do not
 * say. A note that names the rules it concerns is shown under those only; one that names none
 * is about the component whatever the rule (the same six notes under each of nine rules read as
 * noise: design review 2026-11-16). Open, beside the recording, because it often explains a
 * verdict. Each note carries its own source and date: what the engine recorded, what was seen by
 * hand and what was read are never mixed under one label (CLAUDE.md 2.1).
 */
interface ObservationsProps {
  ruleId: string;
  demo: Demo;
  /** The system's variants: a recorded note may have been read from one of their files. */
  variants: readonly LoadedMeasurement[];
}

function Observations({ ruleId, demo, variants }: ObservationsProps) {
  const notes = (demo.observations ?? []).filter(({ rules }) => !rules || rules.includes(ruleId));
  if (notes.length === 0) return null;
  const citedBy = ({ measurement }: Observation) =>
    variants.find((variant) => variant.measurement.target.adapter === measurement);
  return (
    <div className={styles.observations}>
      <p className={styles.observationsTitle}>Worth knowing about this component</p>
      {/* Said before the notes, not after them: a long block must not read as verdicts first. */}
      <p className={styles.observationsBasis}>Not part of any verdict.</p>
      <ul>
        {notes.map((observation) => {
          const { text, source, date } = observation;
          const cited = citedBy(observation);
          return (
            <li key={text}>
              <InlineCode text={text} />
              <span className={styles.observedAs}>
                {/* The date of a variant's recording is in its own provenance line, just below. */}
                {cited
                  ? `${observedAs[source]} on another page of this system, not counted`
                  : `${observedAs[source]}, ${measuredOn(date)}`}
              </span>
              {cited && <VariantProvenance {...cited} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface Fact {
  label: string;
  body: ReactNode;
}

/** What holds for the system on every rule: why it is not counted, how the page was built. */
function systemFacts(demo: Demo): Fact[] {
  const facts: Fact[] = [];
  if (demo.deprecated) {
    facts.push({
      label: 'Deprecated',
      body: (
        <>
          This component is deprecated by its maintainers.{' '}
          <a href={demo.deprecated}>Their accessibility page</a> advises against using it until
          known issues are fixed.
        </>
      ),
    });
  }
  if (demo['not-counted']) {
    facts.push({
      label: 'Not counted',
      body: <InlineCode text={`Left out of agreement: ${demo['not-counted']}.`} />,
    });
  }
  if (demo.composition) {
    facts.push({
      label: 'Docs composition',
      body: <InlineCode text={`Assembled by Atlas. ${demo.composition}`} />,
    });
  }
  if (demo.variant) facts.push({ label: 'Measured as', body: <InlineCode text={demo.variant} /> });
  if (demo.platform) facts.push({ label: 'Platform', body: <InlineCode text={demo.platform} /> });
  return facts;
}

interface ItemFactsProps {
  ruleId: string;
  entry: TargetEntry | undefined;
  model: ModelTradeOff | undefined;
  isUnpositioned: boolean;
  variants: readonly LoadedMeasurement[];
}

/**
 * What a reader must know before the verdict, as labelled rows: each label says what kind of
 * fact it is (status, how the page was built, a different model). They used to be three notes in
 * one style, so a status read like a caveat (design review 2026-11-13).
 */
function ItemFacts({ ruleId, entry, model, isUnpositioned, variants }: ItemFactsProps) {
  const demo = entry?.status === 'measured' ? entry : undefined;
  const facts: Fact[] = [
    ...(demo ? systemFacts(demo) : []),
    ...(model
      ? [
          {
            label: 'Different model',
            body: (
              <>
                {model.model}.{' '}
                <a href={`#${modelNoteId(ruleId, model)}`}>What it gains and costs</a>
              </>
            ),
          },
        ]
      : []),
    ...(isUnpositioned
      ? [
          {
            label: 'No set position',
            body: 'Focus reaches the chips, but they expose no set position, so a screen reader does not hear “2 of 3”. Shown here, not counted in the verdict.',
          },
        ]
      : []),
  ];
  return (
    <>
      {facts.length > 0 && (
        <dl className={styles.facts}>
          {facts.map(({ label, body }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{body}</dd>
            </div>
          ))}
        </dl>
      )}
      {demo && <Observations ruleId={ruleId} demo={demo} variants={variants} />}
    </>
  );
}

interface SystemEvidenceProps {
  ruleId: string;
  loaded: LoadedMeasurement;
  entry: TargetEntry | undefined;
  model: ModelTradeOff | undefined;
}

/**
 * What a reader needs to check one system's recording: what was measured and how it differs
 * from the usual, what to know about the component, its version, browser and date, and the raw
 * data, docs and a way to correct us. Shown under the rule's player for the chosen system.
 */
export function SystemEvidence({ ruleId, loaded, entry, model }: SystemEvidenceProps) {
  const { measurement, file } = loaded;
  const scenarios = scenariosForRule(measurement, ruleId);
  return (
    <div className={styles.systemEvidence}>
      {entry?.component && <p className={styles.component}>{entry.component}</p>}
      <ItemFacts
        ruleId={ruleId}
        entry={entry}
        model={model}
        isUnpositioned={hasUnpositionedChip(scenarios.map(({ scenario }) => scenario))}
        variants={loaded.variants ?? []}
      />
      <EvidenceProvenance measurement={measurement} />
      <p className={styles.links}>
        <EvidenceLinks measurement={measurement} file={file} entry={entry} ruleId={ruleId} />
      </p>
    </div>
  );
}
