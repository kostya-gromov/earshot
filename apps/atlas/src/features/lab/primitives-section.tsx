import { inputWithChips, type Verdict } from '@earshot/contracts';
import { VerdictBadge } from '@/features/evidence';
import { Keycap, SpeechLine } from '@/ui';
import styles from './lab.module.css';
import { ThemePair } from './theme-pair';

// Every key a rule exercises, from the pattern content, so a new key never lacks a keycap.
const ruleKeys = [...new Set(inputWithChips.rules.flatMap(({ keys }) => keys))];
const extraKeys = ['ArrowUp', 'ArrowDown', 'Shift+Tab'];
const verdicts: readonly Verdict[] = ['follows', 'differs', 'inconclusive', 'not-applicable'];

function Specimens() {
  return (
    <>
      <div className={styles.specimens}>
        {[...new Set([...ruleKeys, ...extraKeys])].map((keys) => (
          <Keycap key={keys} keys={keys} />
        ))}
        <Keycap keys="Backspace" pressed />
      </div>
      <div className={styles.specimens}>
        {verdicts.map((verdict) => (
          <VerdictBadge key={verdict} verdict={verdict} />
        ))}
      </div>
      <div>
        <SpeechLine source="focus" size="sm" isPast>
          To, combobox, collapsed
        </SpeechLine>
        <SpeechLine source="focus" size="md">
          Remove Greg Fisher, button, 2 of 2
        </SpeechLine>
        <SpeechLine source="announcement" size="lg">
          Hiroshi Matsui removed. 2 selected
        </SpeechLine>
      </div>
    </>
  );
}

export function PrimitivesSection() {
  return (
    <section className={styles.section} aria-labelledby="lab-primitives">
      <h2 id="lab-primitives" className={styles.sectionTitle}>
        Primitives
      </h2>
      <p className={styles.note}>
        Keycaps for every key the rules use (the last one pressed), verdict badges, and speech
        lines: a past focus line, the current focus line, and a live region message.
      </p>
      <ThemePair>
        <Specimens />
      </ThemePair>
    </section>
  );
}
