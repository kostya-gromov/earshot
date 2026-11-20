/*
 * Reference tabs: a horizontal tab list with one panel shown at a time (docs/proposals/tabs.md).
 * Framework-free; the browser runs this file with types removed.
 *
 * Automatic activation: a tab is activated as it receives focus. APG recommends it "as long as
 * their associated tab panels are displayed without noticeable latency", and every panel here is
 * already in the page. Enter and Space still activate the focused tab, which then does nothing new.
 */

interface Parts {
  tabs: HTMLElement[];
  panelOf: (tab: HTMLElement) => HTMLElement;
}

/** Makes `tab` the active one: the only Tab stop, selected, and its panel the one shown. */
function activate({ tabs, panelOf }: Parts, tab: HTMLElement) {
  for (const each of tabs) {
    const isActive = each === tab;
    each.setAttribute('aria-selected', String(isActive));
    each.tabIndex = isActive ? 0 : -1;
    panelOf(each).hidden = !isActive;
  }
}

/** Moves focus to the tab at `index`, wrapping at both ends, and activates it. */
function focusAt(parts: Parts, index: number) {
  const count = parts.tabs.length;
  const tab = parts.tabs[(index + count) % count]!;
  tab.focus();
  activate(parts, tab);
}

function onKeydown(parts: Parts, event: KeyboardEvent) {
  const current = parts.tabs.indexOf(event.target as HTMLElement);
  if (current === -1) return;
  const moves: Record<string, () => void> = {
    ArrowRight: () => focusAt(parts, current + 1),
    ArrowLeft: () => focusAt(parts, current - 1),
    Home: () => focusAt(parts, 0),
    End: () => focusAt(parts, parts.tabs.length - 1),
  };
  // Up and Down Arrow are not handled: a horizontal tab list leaves them to scroll the page.
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  move();
}

export function createTabs(root: HTMLElement): () => void {
  const tabs = [...root.querySelectorAll<HTMLElement>('[role="tab"]')];
  const panelOf = (tab: HTMLElement) =>
    root.querySelector<HTMLElement>(`#${tab.getAttribute('aria-controls')}`)!;
  const parts: Parts = { tabs, panelOf };
  const controller = new AbortController();
  const { signal } = controller;
  const list = root.querySelector<HTMLElement>('[role="tablist"]')!;

  list.addEventListener('keydown', (event) => onKeydown(parts, event), { signal });
  // A click, Enter or Space on a tab button arrives here as a click.
  list.addEventListener(
    'click',
    (event) => {
      const tab = (event.target as Element).closest<HTMLElement>('[role="tab"]');
      if (tab) activate(parts, tab);
    },
    { signal },
  );
  return () => controller.abort();
}
