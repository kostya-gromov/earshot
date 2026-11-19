'use client';

import { useRef } from 'react';
import { KeysPanel, ListenPanel } from './listen-panel';
import { livePatterns } from './live-patterns';
import { LiveReference } from './live-reference';
import { usePlaygroundControls } from './use-playground-controls';
import { useTranscript } from './use-transcript';
import styles from './playground.module.css';

interface PlaygroundBarProps {
  note: string;
  isWatching: boolean;
  onWatch: () => void;
  onStop: () => void;
  onReset: () => void;
  /** Set when a replay was started from further down the page: the way back to it. */
  onGoBack: (() => void) | undefined;
}

/** "Watch it" turns into "Stop" while it plays, so a running demo can always be ended. */
function WatchButton({
  isWatching,
  onWatch,
  onStop,
}: Pick<PlaygroundBarProps, 'isWatching' | 'onWatch' | 'onStop'>) {
  return (
    <button type="button" className={styles.button} onClick={isWatching ? onStop : onWatch}>
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={styles.icon}>
        {isWatching ? (
          <rect x="4" y="4" width="8" height="8" rx="1" fill="currentColor" />
        ) : (
          <path d="M5 3.5v9l7-4.5z" fill="currentColor" />
        )}
      </svg>
      {isWatching ? 'Stop' : 'Watch it'}
    </button>
  );
}

function PlaygroundBar({ note, onReset, onGoBack, ...watch }: PlaygroundBarProps) {
  return (
    <div className={styles.bar}>
      <h2 id="playground-title" className={styles.title}>
        Try it
      </h2>
      <span className={styles.hint}>Reference implementation, keyboard first</span>
      <p className={styles.note} role="status">
        {note}
      </p>
      <div className={styles.actions}>
        <WatchButton {...watch} />
        <button type="button" className={styles.quietButton} onClick={onReset}>
          Reset
        </button>
        {onGoBack && (
          <button type="button" className={styles.quietButton} onClick={onGoBack}>
            Back to the recording
          </button>
        )}
      </div>
    </div>
  );
}

interface PlaygroundClientProps {
  patternId: string;
  markup: string;
  moduleUrl: string;
  /** Beside: "You would hear" stands next to the field, and the keys go under the field. */
  layout: 'stacked' | 'beside';
}

export function PlaygroundClient({ layout, ...field }: PlaygroundClientProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const transcript = useTranscript(stageRef);
  const controls = usePlaygroundControls(transcript, field.patternId);
  const live = livePatterns[field.patternId];
  return (
    <>
      <PlaygroundBar
        note={controls.note}
        isWatching={controls.isWatching}
        onWatch={() => void controls.watch()}
        onStop={controls.stop}
        onGoBack={controls.canGoBack ? controls.goBack : undefined}
        onReset={controls.startOver}
      />
      <div ref={stageRef} className={styles.stage} {...controls.stage}>
        <LiveReference key={controls.mountKey} {...field} onMount={controls.onMount} />
      </div>
      <ListenPanel
        transcript={transcript}
        firstKey={live?.firstKey ?? 'Tab'}
        firstKeyPlace={live?.firstKeyPlace ?? 'in the field'}
        hasMessages={live?.announces ?? true}
        hasKeys={layout === 'stacked'}
      />
      {layout === 'beside' && <KeysPanel transcript={transcript} />}
    </>
  );
}
