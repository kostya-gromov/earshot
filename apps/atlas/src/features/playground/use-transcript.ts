'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/** A line of the semantic model: said when focus lands, or written to a live region. */
export interface SpokenLine {
  text: string;
  source: 'focus' | 'announcement';
}

const maxLines = 4;
const maxKeys = 6;
/** Longer than the reference takes to speak after a key (its live region waits one frame). */
const silenceAfter = 250;

export interface Transcript {
  lines: readonly SpokenLine[];
  keys: readonly string[];
  /** The last key was followed by no speech: no line is current, and that is said in words. */
  isSilent: boolean;
  say: (text: string, source: SpokenLine['source']) => void;
  pressed: (key: string) => void;
  clear: () => void;
}

/**
 * Whether the last key was followed by silence. A key starts the wait and speech ends it. Focus
 * that left the stage is not silence: the next control speaks, and it is not modelled here.
 */
function useSilence(stageRef: RefObject<HTMLElement | null>) {
  const [isSilent, setIsSilent] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const stopWaiting = useCallback(() => {
    clearTimeout(timer.current);
    setIsSilent(false);
  }, []);
  const waitForSpeech = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (stageRef.current?.contains(document.activeElement)) setIsSilent(true);
    }, silenceAfter);
  }, [stageRef]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { isSilent, waitForSpeech, stopWaiting };
}

/**
 * The last few spoken lines and keys of the live field. Empty at rest: lines that the field
 * beside them did not cause read as a contradiction (design review 2026-11-15), so nothing is
 * shown until a key is pressed, by the person or by "Watch it". `stageRef` is the element the
 * field lives in.
 */
export function useTranscript(stageRef: RefObject<HTMLElement | null>): Transcript {
  const [lines, setLines] = useState<readonly SpokenLine[]>([]);
  const [keys, setKeys] = useState<readonly string[]>([]);
  const { isSilent, waitForSpeech, stopWaiting } = useSilence(stageRef);

  const say = useCallback(
    (text: string, source: SpokenLine['source']) => {
      setLines((current) => [...current, { text, source }].slice(-maxLines));
      stopWaiting();
    },
    [stopWaiting],
  );

  const pressed = useCallback(
    (key: string) => {
      setKeys((current) => [...current, key].slice(-maxKeys));
      waitForSpeech();
    },
    [waitForSpeech],
  );

  const clear = useCallback(() => {
    stopWaiting();
    setLines([]);
    setKeys([]);
  }, [stopWaiting]);

  return { lines, keys, isSilent, say, pressed, clear };
}
