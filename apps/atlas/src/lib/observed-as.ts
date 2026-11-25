import type { Observation, TargetEntry } from '@earshot/contracts';

/** How a note about a system was made, as the site says it beside the note. */
export const observedAs: Readonly<Record<Observation['source'], string>> = {
  recorded: 'Recorded by the engine',
  seen: 'Seen by hand on the measured page',
  screenshots: 'Seen in screenshots of the measured page, before and after each key',
  script: 'Seen with a script on the measured page, outside the engine',
  'package-source': 'Read in the package source',
  docs: 'Read in the system’s docs',
  discussion: 'Said in a public discussion',
};

/** The same, in the two or three words a caption has room for. */
const observedAsShort: Readonly<Record<Observation['source'], string>> = {
  recorded: 'Recorded by the engine',
  seen: 'Seen by hand',
  screenshots: 'Seen in screenshots',
  script: 'Seen with a script',
  'package-source': 'Read in the package source',
  docs: 'Read in the docs',
  discussion: 'Said in a public discussion',
};

/** A note shown on its own, apart from any recording, with how, on what and when it was made. */
export interface SeenNote {
  system: string;
  text: string;
  /** "Seen by hand · 3.38.0 · 2026-11-13": how, the version where the note gives it, when. */
  how: string;
  version: string | undefined;
  date: string;
}

/**
 * What each system was seen to do for a rule, in a few words, where a note gives a `summary`.
 * The home page shows it under its own caption, out of the recorded frame: a note made by hand
 * is not a recording, and a date under "Recorded" did not make that plain (2026-11-25).
 */
export function seenFor(
  targets: readonly TargetEntry[],
  ruleId: string,
): ReadonlyMap<string, SeenNote> {
  return new Map(
    targets.flatMap((entry) => {
      if (entry.status !== 'measured') return [];
      const note = (entry.observations ?? []).find(
        ({ summary, rules }) => summary !== undefined && (!rules || rules.includes(ruleId)),
      );
      if (!note?.summary) return [];
      const seen: SeenNote = {
        system: entry.system,
        text: note.summary,
        how: observedAsShort[note.source],
        version: note.version,
        date: note.date,
      };
      return [[entry.adapter, seen] as const];
    }),
  );
}
