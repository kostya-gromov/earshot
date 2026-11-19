'use client';

import { useCallback, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { attachSpeech } from './attach-speech';
import { livePatterns, type LivePattern } from './live-patterns';
import { useRegisterPlayground } from './playground-link';
import { nextStepNote, replayKeys } from './replay';
import { useTourActions } from './tour-context';
import { useReturnTo } from './use-return-to';
import { useTourKeys } from './use-tour-keys';
import type { Transcript } from './use-transcript';

const modifiers = new Set(['Shift', 'Meta', 'Control', 'Alt']);
const scrollBehavior = (): ScrollBehavior =>
  matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)));

function isWholeInView(element: Element) {
  const { top, bottom } = element.getBoundingClientRect();
  return top >= 0 && bottom <= window.innerHeight;
}

/**
 * The field after Reset has remounted it, with the whole playground scrolled into view: the
 * field and, under it, the line being spoken (on a phone, centring the field alone left that
 * line cut by the bottom edge). Undefined if the field is gone.
 */
async function remountedField(rootRef: { current: HTMLElement | null }) {
  await nextFrame();
  const playground = rootRef.current?.closest('section') ?? rootRef.current;
  // A playground already whole on screen stays where it is: nothing to bring into view.
  if (playground && !isWholeInView(playground)) {
    playground.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
  }
  return rootRef.current ?? undefined;
}

interface Attachment {
  root: HTMLElement;
  live: LivePattern | undefined;
  onSpeech: Parameters<typeof attachSpeech>[1];
}

/** Speech for the transcript and what the pattern adds around its field; one cleanup. */
function attachAll({ root, live, onSpeech }: Attachment) {
  const detach = [attachSpeech(root, onSpeech), ...(live?.attach(root) ?? [])];
  return () => detach.forEach((stop) => stop());
}

/**
 * Which "Watch it" run is current. Starting, stopping or resetting makes a new run, so a replay
 * still sleeping between keys sees it was cancelled and stops.
 */
function useWatchRun() {
  const runRef = useRef(0);
  const [isWatching, setIsWatching] = useState(false);
  const stop = useCallback(() => {
    runRef.current += 1;
    setIsWatching(false);
  }, []);
  const begin = () => {
    setIsWatching(true);
    return runRef.current;
  };
  const isCurrent = (run: number) => runRef.current === run;
  /** Ends the run that finished by itself; false when it was cancelled on the way. */
  const finish = (run: number) => {
    if (!isCurrent(run)) return false;
    setIsWatching(false);
    return true;
  };
  return { isWatching, stop, begin, isCurrent, finish };
}

interface StageInput {
  pressed: Transcript['pressed'];
  tourKey: (key: string) => void;
  onTakeOver: () => void;
}

/**
 * The person's own input on the stage, and whose input came last. A replay can type, and what
 * the field announces then is not the person's doing: it lights a rule and completes nothing.
 */
function useStageInput({ pressed, tourKey, onTakeOver }: StageInput) {
  const lastInput = useRef<'person' | 'replay'>('person');
  // The person's first key or press ends a running "Watch it": the field is theirs.
  const takeOver = () => {
    lastInput.current = 'person';
    onTakeOver();
  };
  function onKeyDownCapture(event: KeyboardEvent<HTMLDivElement>) {
    // Only real keys go in the trail; Watch it reports its own keys.
    if (!event.nativeEvent.isTrusted || modifiers.has(event.key)) return;
    takeOver();
    // A shortcut (select all, paste) is not a key of the pattern: no keycap, no tour step.
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.shiftKey && event.key === 'Tab' ? 'Shift+Tab' : event.key;
    pressed(key);
    tourKey(key);
  }
  return { lastInput, stage: { onKeyDownCapture, onPointerDownCapture: takeOver } };
}

interface FieldMount {
  rootRef: RefObject<HTMLElement | null>;
  live: LivePattern | undefined;
  say: Transcript['say'];
  tour: ReturnType<typeof useTourActions>;
  lastInput: RefObject<'person' | 'replay'>;
}

/** What happens when the reference mounts: its root is kept and its speech goes two ways. */
function useFieldMount({ rootRef, live, say, tour, lastInput }: FieldMount) {
  return useCallback(
    (root: HTMLElement) => {
      rootRef.current = root;
      const onSpeech: Attachment['onSpeech'] = (text, source) => {
        say(text, source);
        if (source === 'announcement') tour?.heard(text, lastInput.current);
      };
      return attachAll({ root, live, onSpeech });
    },
    [rootRef, live, say, tour, lastInput],
  );
}

/** Mount, Reset and Watch it for the playground; the transcript records what happens. */
export function usePlaygroundControls({ say, pressed, clear }: Transcript, patternId: string) {
  const live = livePatterns[patternId];
  const [mountKey, setMountKey] = useState(0);
  const [note, setNote] = useState('');
  const rootRef = useRef<HTMLElement | null>(null);
  const run = useWatchRun();
  const back = useReturnTo();
  const tour = useTourActions();
  const tourKey = useTourKeys(rootRef);
  // Taking over from a running "Watch it" starts the trail and the lines afresh: they are the
  // person's from here, not a mix of both.
  const onTakeOver = () => {
    if (run.isWatching) clear();
    run.stop();
  };
  const { lastInput, stage } = useStageInput({ pressed, tourKey, onTakeOver });

  const onMount = useFieldMount({ rootRef, live, say, tour, lastInput });

  /** Starts the field afresh. `from` is the control a replay came from, kept as the way back. */
  function reset(from?: HTMLElement) {
    run.stop();
    back.setFrom(from);
    clear();
    setNote('');
    setMountKey((key) => key + 1);
  }

  async function watch(keys: readonly string[] = live?.watchSequence ?? [], from?: HTMLElement) {
    reset(from);
    const current = run.begin();
    const root = await remountedField(rootRef);
    if (!root) return;
    const stoppedAt = await replayKeys({
      root,
      keys,
      onKey: (key) => {
        lastInput.current = 'replay';
        pressed(key);
        tour?.light(key, root);
      },
      isCancelled: () => !run.isCurrent(current),
    });
    if (run.finish(current) && stoppedAt) setNote(nextStepNote(stoppedAt));
  }

  /** The Reset button: the field afresh, and the tour with it. */
  const startOver = () => {
    reset();
    tour?.reset();
  };

  useRegisterPlayground((keys, from) => void watch(keys, from));
  return { mountKey, note, ...run, ...back, onMount, stage, startOver, watch };
}
