/*
 * The API the in-page scripts install on `window.__earshot` (non-enumerable). Shared by the
 * page scripts, which run in the browser, and the shell, which calls them via page.evaluate.
 */
import type { RawAnnouncement, RawInsertedRegion } from '../../model/announcements.ts';

export interface FocusFacts {
  isBody: boolean;
  isInsideComponent: boolean;
  path: string;
  /** From aria-posinset / aria-setsize, when the author set them. */
  ariaPosInSet: number | null;
  ariaSetSize: number | null;
  /** The aria-activedescendant attribute as written, or null when absent or empty. */
  activeDescendantId: string | null;
  /** The text in a text field; null for anything else, and for a password field. */
  value: string | null;
  /** The same number for the same element, for as long as the page lives. */
  element: number;
  /** The aria-haspopup attribute as written; null when the element does not have it. */
  ariaHasPopup: string | null;
}

export interface QuietResult {
  ms: number;
  quiet: boolean;
}

export interface EarshotPage {
  /** Open or closed shadow root of a host; closed ones are caught by wrapping attachShadow. */
  shadowRootOf: (host: Element) => ShadowRoot | null;
  onShadowRoot: (listener: (root: ShadowRoot) => void) => void;
  now: () => number;

  /** The adapter's component root, kept in page memory so the DOM is never modified. */
  setRoot: (element: Element) => void;
  root: () => Element | null;
  deepActiveElement: () => Element | null;
  describeFocus: (element: Element) => FocusFacts;

  /** Remembers the elements under a key and returns how many there are. */
  holdNodes: (key: string, elements: Element[]) => number;
  heldNode: (key: string, index: number) => Element | null;

  drainAnnouncements: () => RawAnnouncement[];
  /** Live regions that entered the page already holding text, since the last drain. */
  drainInsertedRegions: () => RawInsertedRegion[];

  waitForQuiet: (options: { quietMs: number; capMs: number }) => Promise<QuietResult>;
}

declare global {
  interface Window {
    __earshot: EarshotPage;
  }
}
