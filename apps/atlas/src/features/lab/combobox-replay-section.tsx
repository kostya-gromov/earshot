import type { Measurement } from '@earshot/contracts';
import { ComboboxFrames, ComboboxLegend } from '@/features/replay';
import { comboboxScenario } from '@/lib/combobox-replay';
import styles from './lab.module.css';

interface Specimen {
  measurement: Measurement;
  scenarioId: string;
}

/** When and with what a file was measured; nothing for a record that is not a measurement. */
function measuredWords({ provenance }: Measurement): string {
  if (provenance.status !== 'measured') return 'not measured';
  return `measured ${provenance.measuredAt.slice(0, 10)}, engine ${provenance.engineVersion}`;
}

/** One recording as it will be replayed: who, which version, and every step. */
function Recording({ measurement, scenarioId }: Specimen) {
  const { target } = measurement;
  const scenario = measurement.scenarios.find(({ id }) => id === scenarioId);
  if (!scenario) return null;
  return (
    <article className={styles.recording}>
      <h3 className={styles.recordingTitle}>
        {target.adapter === 'reference' ? 'Reference' : target.system}{' '}
        <span className={styles.recordingMeta}>
          {target.systemVersion.version} · {scenarioId} · {measuredWords(measurement)}
        </span>
      </h3>
      <ComboboxFrames
        steps={comboboxScenario(measurement, scenarioId)}
        start={scenario.initialState}
      />
    </article>
  );
}

/**
 * The combobox replay on measured recordings, before the pattern has a page. The reference shows
 * both marks on one row; a system that keeps "selected" for the chosen value shows them apart.
 */
export function ComboboxReplaySection({ specimens }: { specimens: readonly Specimen[] }) {
  return (
    <section className={styles.section} aria-labelledby="lab-combobox-replay">
      <h2 id="lab-combobox-replay" className={styles.sectionTitle}>
        Combobox replay
      </h2>
      <p className={styles.note}>
        Preview on measured recordings. The pattern is not published: its page and the manual screen
        reader check are still to come.
      </p>
      <ComboboxLegend />
      {specimens.map((specimen) => (
        <Recording
          key={`${specimen.measurement.target.adapter}-${specimen.scenarioId}`}
          {...specimen}
        />
      ))}
    </section>
  );
}
