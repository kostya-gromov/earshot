import { patternItems } from '@/features/command-palette';
import { Disclosure, Tabs, type TabItem } from '@/ui';
import styles from './lab.module.css';
import { PaletteDemo } from './palette-demo';

const lensTabs: readonly TabItem[] = [
  {
    id: 'design',
    label: 'For design',
    description: 'Requirements with reasons and sources',
    panel: <p className={styles.note}>Design lens content.</p>,
  },
  {
    id: 'code',
    label: 'For code',
    description: 'Reference source with notes and the behavior contract',
    panel: <p className={styles.note}>Code lens content.</p>,
  },
];

const fileTabs: readonly TabItem[] = ['chip-field.ts', 'chip-list.ts', 'announcer.ts'].map(
  (file) => ({ id: file, label: file, panel: <p className={styles.note}>Source of {file}.</p> }),
);

export function InteractiveSection() {
  return (
    <section className={styles.section} aria-labelledby="lab-interactive">
      <h2 id="lab-interactive" className={styles.sectionTitle}>
        Interactive primitives
      </h2>
      <p className={styles.note}>
        Disclosure, tabs and the ⌘K palette, built to the APG patterns. Behavior tests run against
        this page.
      </p>
      <PaletteDemo items={patternItems} />
      <div data-testid="lab-disclosure">
        <Disclosure label="Evidence">
          <p className={styles.note}>Evidence for one rule: reference and measured systems.</p>
        </Disclosure>
      </div>
      <div data-testid="lab-lens-tabs">
        <Tabs label="Lens" items={lensTabs} variant="lens" />
      </div>
      <div data-testid="lab-file-tabs">
        <Tabs label="Reference files" items={fileTabs} />
      </div>
    </section>
  );
}
