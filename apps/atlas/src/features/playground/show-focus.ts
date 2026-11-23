/**
 * A replay is started with the pointer, and after a pointer press the browser draws no focus
 * ring on a button that a script gives focus to (the `:focus-visible` heuristic; a text field
 * always gets one). The replay shows keys, so focus has to be seen as after a key: `focusVisible`
 * asks for the ring. Where a browser does not know the option, focus moves as before, without it.
 */
export const asAfterAKey = { preventScroll: true, focusVisible: true } as FocusOptions;

const focusEvents = ['focus', 'blur', 'focusin', 'focusout'] as const;

const swallow = (event: Event) => event.stopImmediatePropagation();

/**
 * Shows the ring on the element that has focus when a key's own handler, or the browser, put
 * focus there without one: the button a dialog or a menu returns focus to. The ring is decided
 * when focus arrives, so focus is taken off and given back; nothing on the page hears that,
 * since focus did not move. Inside an open menu it is left alone: the reference draws its own
 * mark on the focused item.
 */
export function showFocusRing() {
  const focused = document.activeElement;
  if (!(focused instanceof HTMLElement) || focused === document.body) return;
  if (focused.matches(':focus-visible') || focused.closest('[role="menu"]')) return;
  for (const type of focusEvents) window.addEventListener(type, swallow, true);
  focused.blur();
  focused.focus(asAfterAKey);
  for (const type of focusEvents) window.removeEventListener(type, swallow, true);
}
