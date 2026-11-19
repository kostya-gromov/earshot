'use client';

import { usePlayInPlayground } from './playground-link';
import styles from './playground.module.css';

/** Plays a recorded scenario's keys into the live reference: real key events, real behavior. */
export function ReplayInPlayground({ keys }: { keys: readonly string[] }) {
  const play = usePlayInPlayground();
  if (!play) return null;
  return (
    <button
      type="button"
      className={styles.smallButton}
      onClick={(event) => play(keys, event.currentTarget)}
    >
      Replay in playground
    </button>
  );
}
