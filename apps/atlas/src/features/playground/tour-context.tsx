'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { KeyObservation, Tour, TourProgress, TourStep } from './tour';
import { tours } from './tours';

interface TourActions {
  /** A real key press with the field before and after it. Replays never call this. */
  observe: (observation: KeyObservation<unknown>) => void;
  /** A live region message. It completes a step only when the person's own input caused it. */
  heard: (text: string, cause: 'person' | 'replay') => void;
  /** Lights the rules a key exercises in the field as it is, for real presses and replays alike. */
  light: (key: string, root: HTMLElement) => void;
  /** The mounted reference as this pattern's tour reads it. */
  snapshot: (root: HTMLElement) => unknown;
  /** Reset starts the field afresh, and the tour with it. */
  reset: () => void;
}

interface TourView {
  steps: readonly TourStep[];
  heardRule: string | undefined;
  progress: TourProgress;
  lit: ReadonlySet<string>;
}

// Two contexts: the playground needs stable actions (its mount must not change with every
// press), the rule set needs the changing state.
const ActionsContext = createContext<TourActions | undefined>(undefined);
const ViewContext = createContext<TourView | undefined>(undefined);
const litFor = 1400;

function useLitRules() {
  const [lit, setLit] = useState<ReadonlySet<string>>(new Set());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const lightRules = useCallback((rules: readonly string[]) => {
    for (const rule of rules) {
      setLit((current) => new Set([...current, rule]));
      clearTimeout(timers.current.get(rule));
      const off = () => setLit((current) => new Set([...current].filter((r) => r !== rule)));
      timers.current.set(rule, setTimeout(off, litFor));
    }
  }, []);
  return { lit, lightRules };
}

interface TourScopeProps {
  tour: Tour;
  children: ReactNode;
}

function TourScope({ tour, children }: TourScopeProps) {
  const [progress, setProgress] = useState(tour.initial);
  const { lit, lightRules } = useLitRules();
  const actions = useMemo<TourActions>(
    () => ({
      observe: (observation) => setProgress((p) => tour.observeKey(p, observation)),
      heard: (text, cause) => {
        if (cause === 'person') setProgress((p) => tour.heardMessage(p, text));
        if (tour.heardRule !== undefined) lightRules([tour.heardRule]);
      },
      light: (key, root) => lightRules(tour.rulesLitBy(key, tour.snapshot(root))),
      snapshot: tour.snapshot,
      reset: () => setProgress(tour.initial),
    }),
    [tour, lightRules],
  );
  const view = useMemo(
    () => ({ steps: tour.steps, heardRule: tour.heardRule, progress, lit }),
    [tour, progress, lit],
  );
  return (
    <ActionsContext value={actions}>
      <ViewContext value={view}>{children}</ViewContext>
    </ActionsContext>
  );
}

interface TourProviderProps {
  patternId: string;
  children: ReactNode;
}

/** The tour of this pattern for the playground and the rule set inside; none if it has no tour. */
export function TourProvider({ patternId, children }: TourProviderProps) {
  const tour = tours[patternId];
  return tour ? <TourScope tour={tour}>{children}</TourScope> : children;
}

/** Tour actions when the playground sits next to a rule set; undefined elsewhere. */
export const useTourActions = (): TourActions | undefined => useContext(ActionsContext);

export const useTourView = (): TourView | undefined => useContext(ViewContext);
