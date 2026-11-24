import type { Metadata } from 'next';
import { combobox } from '@earshot/contracts';
import { loadMeasurements } from '@/data/measurements';
import {
  ColorSection,
  ComboboxReplaySection,
  InteractiveSection,
  PrimitivesSection,
  SpaceSection,
  TypeSection,
  labStyles as styles,
} from '@/features/lab';

export const metadata: Metadata = { title: 'Lab' };

/** What the preview shows: both marks on one row, the marks apart, and the value still selected. */
const specimens = [
  { adapter: 'reference', scenarioId: 'type-then-move' },
  { adapter: 'mui', scenarioId: 'type-then-move' },
  { adapter: 'mui', scenarioId: 'reopen' },
] as const;

/** D1b and D2: every token and primitive on one page, in both themes. */
export default async function LabPage() {
  const measurements = await loadMeasurements(combobox);
  const shown = specimens.flatMap(({ adapter, scenarioId }) => {
    const found = measurements.find(({ measurement }) => measurement.target.adapter === adapter);
    return found ? [{ measurement: found.measurement, scenarioId }] : [];
  });
  return (
    <main className={styles.page}>
      <header>
        <p className={styles.kicker}>Design lab</p>
        <h1 className={styles.title}>Tokens and primitives</h1>
        <p className={styles.lede}>
          The values every Earshot page is built from, extracted from the approved D1a mockup.
        </p>
      </header>
      <PrimitivesSection />
      <InteractiveSection />
      <ComboboxReplaySection specimens={shown} />
      <ColorSection />
      <TypeSection />
      <SpaceSection />
    </main>
  );
}
