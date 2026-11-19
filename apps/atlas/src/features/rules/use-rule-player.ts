'use client';

import { useCallback, useRef, useState } from 'react';
import { shownScenario } from '@/lib/chosen-scenario';
import { decidingScenario, type ReplayLane } from '@/lib/replay';

interface RulePlayer {
  ruleId: string;
  lanes: readonly ReplayLane[];
  /** The rule's first scenario: shown when no scenario decided the verdict on its own. */
  first: string;
}

const isReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Which system and which scenario a rule's player shows. The scenario is the person's own choice
 * for as long as the systems they visit recorded it; until they choose, and where a system has
 * no recording of their choice, it is the scenario that decided that system's verdict.
 */
export function useRulePlayer({ ruleId, lanes, first }: RulePlayer) {
  const [current, setCurrent] = useState(lanes[0]?.id ?? '');
  const [chosen, setChosen] = useState<string>();
  const recording = useRef<HTMLDivElement>(null);
  const lane = lanes.find(({ id }) => id === current);
  const verdict = lane?.verdicts[ruleId];
  const shown = shownScenario(
    chosen,
    (verdict && decidingScenario(verdict)) ?? first,
    (id) => (lane?.steps[id]?.length ?? 0) > 0,
  );
  // Where the recording does not stay in view by itself (a narrow screen, one column), choosing
  // a scenario brings it there. Focus is not moved: it stays on the row that was chosen.
  const selectScenario = useCallback((id: string) => {
    setChosen(id);
    const element = recording.current;
    if (!element || getComputedStyle(element).position === 'sticky') return;
    element.scrollIntoView({ block: 'nearest', behavior: isReduced() ? 'auto' : 'smooth' });
  }, []);
  return { current, lane, ...shown, recording, selectSystem: setCurrent, selectScenario };
}
