export interface ShownScenario {
  /** The scenario whose recording is shown. */
  scenario: string;
  /** The scenario the person chose, when this system has no recording of it to show. */
  missing: string | undefined;
}

/**
 * Which scenario a system's replay shows. The one the person chose themselves, as long as this
 * system recorded it: a choice is kept from system to system, so one scenario can be compared
 * across all of them. Otherwise the scenario that decided the system's verdict, so that without
 * a choice the replay and the verdict beside it never disagree; and when the choice cannot be
 * shown, it is named, so the fallback is not silent (2026-11-16).
 */
export function shownScenario(
  chosen: string | undefined,
  deciding: string,
  isRecorded: (scenario: string) => boolean,
): ShownScenario {
  if (chosen === undefined) return { scenario: deciding, missing: undefined };
  if (isRecorded(chosen)) return { scenario: chosen, missing: undefined };
  return { scenario: deciding, missing: chosen === deciding ? undefined : chosen };
}
