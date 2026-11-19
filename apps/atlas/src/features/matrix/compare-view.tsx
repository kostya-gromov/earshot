'use client';

import { useEffect, useState } from 'react';
import { parseCompared, serializeCompared, toggleCompared } from '@/lib/compare-selection';
import type { ReplayLane } from '@/lib/replay';
import { ComparePicker } from './compare-picker';
import type { CompareOption } from './compare-types';
import { ReplayGrid, type GridScenario } from './replay-grid';
import styles from './matrix.module.css';

interface CompareViewProps {
  options: readonly CompareOption[];
  fallback: readonly string[];
  /** Recordings: the reference and every option, by id. */
  lanes: readonly ReplayLane[];
  scenarios: readonly GridScenario[];
  people: readonly string[];
}

const queryKey = 'compare';

/** The picked systems replayed next to the reference; the choice lives in the URL to share. */
export function CompareView({ options, fallback, lanes, scenarios, people }: CompareViewProps) {
  const [selected, setSelected] = useState<readonly string[]>(fallback);
  const available = options.map(({ id }) => id);

  // The static page renders the default; a shared link's choice applies once the page runs.
  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get(queryKey);
    setSelected(parseCompared(query, { available: options.map(({ id }) => id), fallback }));
  }, [options, fallback]);

  function toggle(id: string) {
    const next = toggleCompared(selected, id);
    setSelected(next);
    // Built by hand: URLSearchParams would encode the commas, and the link is meant to be read.
    const query = `?${queryKey}=${serializeCompared(next)}`;
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${query}${window.location.hash}`,
    );
  }

  // Shown in the picker's order, so a lane never jumps when another is added.
  const shown = available.filter((id) => selected.includes(id));
  const ordered = [
    ...lanes.filter((lane) => lane.isReference),
    ...shown.flatMap((id) => lanes.filter((lane) => lane.id === id)),
  ];
  return (
    <div className={styles.compare}>
      <ComparePicker options={options} selected={selected} onToggle={toggle} />
      <ReplayGrid scenarios={scenarios} lanes={ordered} people={people} />
    </div>
  );
}
