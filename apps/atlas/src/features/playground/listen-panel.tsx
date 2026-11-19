import { Keycap, SpeechLine } from '@/ui';
import type { Transcript } from './use-transcript';
import styles from './playground.module.css';

/** The keys that caused the lines; the person's own presses, so not repeated to a screen reader. */
function KeyTrail({ keys }: { keys: Transcript['keys'] }) {
  return (
    <div className={styles.trail} aria-hidden="true">
      {keys.map((key, index) => (
        <Keycap key={`${index}-${key}`} keys={key} pressed={index === keys.length - 1} />
      ))}
    </div>
  );
}

/** "What you press", for a playground whose field has "You would hear" beside it. */
export function KeysPanel({ transcript }: { transcript: Transcript }) {
  return (
    <div className={styles.keysPanel}>
      <KeyTrail keys={transcript.keys} />
    </div>
  );
}

interface ListenSideProps {
  keys: Transcript['keys'] | undefined;
  /** False for a reference with no live region: its legend then names one kind of line only. */
  hasMessages: boolean;
}

function ListenSide({ keys, hasMessages }: ListenSideProps) {
  return (
    <div>
      <p className={styles.listenLabel}>You would hear</p>
      <p className={styles.listenNote}>
        Semantic model of a screen reader, not a recording. <a href="/methodology/">How it works</a>
      </p>
      <ul className={styles.legend} aria-label="Legend">
        <li>
          <span className={styles.legendFocus} aria-hidden="true">
            Aa
          </span>
          Said when focus lands
        </li>
        {hasMessages && (
          <li>
            <span className={styles.legendHeard} aria-hidden="true">
              Aa
            </span>
            Live region message
          </li>
        )}
      </ul>
      {keys && <KeyTrail keys={keys} />}
    </div>
  );
}

interface TranscriptLogProps {
  lines: Transcript['lines'];
  /** The last key was followed by no speech: no line is the current one. */
  isSilent: boolean;
}

function TranscriptLog({ lines, isSilent }: TranscriptLogProps) {
  return (
    // The reference's own live region speaks; this log must not speak a second time.
    <div role="log" aria-live="off" aria-label="Transcript" className={styles.transcript}>
      {lines.map((line, index) => {
        const isLatest = !isSilent && index === lines.length - 1;
        return (
          <SpeechLine
            key={`${index}-${line.text}`}
            source={line.source}
            size={isLatest ? 'lg' : 'md'}
            isPast={!isLatest}
          >
            {line.text}
          </SpeechLine>
        );
      })}
      {/* Not speech, so not in the voice's typeface: the same words as in every recording. */}
      {isSilent && <p className={styles.silent}>Nothing said</p>}
    </div>
  );
}

/**
 * The way in, where the first line will appear. Interface text, not speech. The key is a real
 * keycap, and a keycap carries its spoken name, so a screen reader reads "Press Down Arrow in the
 * field" and not a glyph or nothing.
 */
function Prompt({ firstKey, place }: { firstKey: string; place: string }) {
  return (
    <p className={styles.prompt}>
      Press <Keycap keys={firstKey} /> {place}
    </p>
  );
}

interface ListenPanelProps {
  transcript: Transcript;
  /** The key the empty transcript invites, and where to press it: “in the field”. */
  firstKey: string;
  firstKeyPlace: string;
  /** Whether the pattern's reference writes to a live region at all. */
  hasMessages: boolean;
  /** False when the keys are shown under the field instead (KeysPanel). */
  hasKeys: boolean;
}

/** "You would hear": the semantic model's lines, newest largest, and the keys that caused them. */
export function ListenPanel(props: ListenPanelProps) {
  const { transcript, firstKey, firstKeyPlace, hasMessages, hasKeys } = props;
  const { lines, isSilent } = transcript;
  return (
    <div className={styles.listen}>
      <ListenSide keys={hasKeys ? transcript.keys : undefined} hasMessages={hasMessages} />
      <div className={styles.transcriptWrap}>
        {lines.length === 0 && !isSilent && <Prompt firstKey={firstKey} place={firstKeyPlace} />}
        <TranscriptLog lines={lines} isSilent={isSilent} />
      </div>
    </div>
  );
}
