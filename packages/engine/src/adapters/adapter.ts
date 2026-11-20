import type { Locator, Page } from '@playwright/test';
import type { Action, SystemVersion } from '@earshot/contracts';

/** Expected failures are values (engineering-standards.md 4): a failed setup is inconclusive, not a crash. */
export type SetupResult =
  { ok: true; actualStateDescription: string } | { ok: false; reason: string };

export type ClickTarget = Extract<Action, { type: 'click' }>['target'];

export type ResolveClickResult =
  { ok: true; locator: Locator; target: ClickTarget } | { ok: false; reason: string };

/**
 * Target-specific glue (packages/engine/CLAUDE.md, Adapters): how to reach the component, put it in a known state
 * using it like a user would, and read the system's version from something verifiable.
 */
export interface Adapter<State, InteractionId extends string> {
  id: string;
  system: string;
  /** Bumped when the adapter's behavior changes, so measurements say which glue produced them. */
  version: number;
  url: string;
  /** Recorded instead of url for locally served pages: their path in the repository. */
  page?: string;
  root: (page: Page) => Locator;
  /**
   * The pattern's items a user moves between (chips), in DOM order. The engine records which one
   * holds focus, so a chip is recognised even when the accessibility tree gives no set position;
   * `description` says how they are found and is shown on the evidence card.
   */
  items: { locate: (page: Page) => Locator; description: string };
  /**
   * Patterns with a popup only: the element that holds the options (the listbox), wherever the
   * system renders it. Its options are `items`. The engine records both around every step.
   */
  popup?: {
    locate: (page: Page) => Locator;
    description: string;
    /** The element that opens the popup, when it is not the focused field itself (a menu button). */
    opener?: (page: Page) => Locator;
  };
  /**
   * Where the page shows what an action did, when a rule has to know that an item was activated:
   * an element the page's own handlers write to ("Last action: Rename"). Its text is recorded
   * around every step.
   */
  effect?: { locate: (page: Page) => Locator; description: string };
  /**
   * Tabs only: the tab panels, shown or not, wherever the system renders them. The tabs are
   * `items`. The engine records every tab and every shown panel around each step, and whether
   * focus is inside a shown panel.
   */
  panels?: { locate: (page: Page) => Locator; description: string };
  ready: (page: Page) => Promise<void>;
  setup: (page: Page, state: State) => Promise<SetupResult>;
  resolveClickTarget: (page: Page, id: InteractionId) => Promise<ResolveClickResult>;
  readVersion: (page: Page) => Promise<SystemVersion>;
  /** Public targets are visited at a polite rate (packages/engine/CLAUDE.md, Targets and conduct); local targets omit it. */
  pauseBetweenRunsMs?: number;
  notes?: string;
}
