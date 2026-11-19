/**
 * Patterns announced in CLAUDE.md 3 that have no content or measurements yet. Shown as planned,
 * with no numbers; each needs an approved proposal first (CLAUDE.md 7, M4). The descriptions say
 * what the pattern is (CLAUDE.md 7, M4 drafts), never how a system behaves.
 */
export interface PlannedPattern {
  id: string;
  name: string;
  description: string;
}

/** None now: the three patterns of phase 1 (CLAUDE.md 3) all have a page. */
export const plannedPatterns: readonly PlannedPattern[] = [];
