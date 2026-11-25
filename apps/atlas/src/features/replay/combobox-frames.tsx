import {
  describeComboboxChange,
  describeComboboxStep,
  type ComboboxStep,
} from '@/lib/combobox-replay';
import { Keycap, SpeechLine } from '@/ui';
import { ComboboxField } from './combobox-field';
import styles from './combobox.module.css';

/** The key of a step: a keycap for a pressed key, the typed text for typing. */
function StepKey({ step }: { step: ComboboxStep }) {
  if (step.key.startsWith('“')) return <span className={styles.typed}>Type {step.key}</span>;
  return <Keycap keys={step.key} size="sm" />;
}

/** The semantic model's lines for a step, as ordinary text: announcements in violet. */
function Spoken({ step }: { step: ComboboxStep }) {
  if (step.speech.length === 0) return <p className={styles.silent}>No modelled speech</p>;
  return step.speech.map((line) => (
    <SpeechLine
      key={line}
      source={step.written.includes(line) ? 'announcement' : 'focus'}
      size="sm"
    >
      {line}
    </SpeechLine>
  ));
}

interface ComboboxFramesProps {
  steps: readonly ComboboxStep[];
  /** The scenario's recorded starting state, such as "empty combobox focused, popup closed". */
  start: string;
}

/**
 * A recording step by step, for places with the full width of the page. Beside each schematic
 * stands what the step changed; the whole state, with the step's place in the recording, is
 * written for assistive technology, which does not get the schematic.
 */
export function ComboboxFrames({ steps, start }: ComboboxFramesProps) {
  return (
    <div className={styles.recording}>
      <p className={styles.start}>Starting state: {start}.</p>
      <ol className={styles.frames}>
        {steps.map((step, index) => (
          <li key={index} className={styles.frame}>
            <p className={styles.key}>
              <span className={styles.number} aria-hidden="true">
                {index + 1}
              </span>
              <span className="visually-hidden">
                Step {index + 1} of {steps.length}:{' '}
              </span>
              <StepKey step={step} />
            </p>
            <ComboboxField moment={step.after} size="sm" />
            <p className={styles.what}>{describeComboboxChange(step)}</p>
            <p className="visually-hidden">{describeComboboxStep(step)}.</p>
            <Spoken step={step} />
            {step.inserted.length > 0 && (
              <p className={styles.inserted}>
                A live region arrived holding: {step.inserted.map((text) => `“${text}”`).join(', ')}
                .
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
