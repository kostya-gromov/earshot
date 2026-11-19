import { ContentsNav } from './contents-nav';
import styles from './methodology.module.css';

const inShort = [
  'Rules come from the ARIA Authoring Practices; where a WCAG 2.2 criterion bears on one, it is cited as related. What Atlas adds, and APG notes it does not hold as rules, are labelled Atlas recommendations.',
  'The engine presses real keys in Chromium on each system’s published package, three times per scenario.',
  'It records where focus goes, how the accessibility tree changes, and what live regions announce.',
  'It does not look at the screen, use a pointer or touch, or run a real screen reader.',
  'Spoken lines on the site are a semantic model built from that record, not screen reader output.',
  'A verdict is Follows, Differs, Inconclusive or Not applicable. Differing is not failing.',
  'Every result shows its version, browser and date, and links to the raw file it came from.',
];

/** The whole method in seven lines, for a reader who will not read the page. */
export function InShort() {
  return (
    <section className={styles.summary} aria-labelledby="in-short-title">
      <h2 id="in-short-title">In short</h2>
      <ul>
        {inShort.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

export const contents = [
  { id: 'standards', label: 'What the rules rest on' },
  { id: 'systems', label: 'Which systems are measured' },
  { id: 'run', label: 'What one run does' },
  { id: 'scenarios', label: 'The scenarios' },
  { id: 'recorded', label: 'What is recorded' },
  { id: 'semantic-model', label: 'The semantic model' },
  { id: 'verdicts', label: 'Verdicts' },
  { id: 'reading', label: 'How to read a result' },
  { id: 'provenance', label: 'Provenance' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'changes', label: 'What changed, and when' },
  { id: 'corrections', label: 'Suggest a correction' },
  { id: 'terms', label: 'Terms' },
] as const;

/** Every part of the page, in order: a long reference page is read by jumping. */
export function Contents() {
  return <ContentsNav entries={contents} />;
}
