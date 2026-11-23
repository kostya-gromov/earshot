/**
 * Runs in <head> before the first paint and marks Apple platforms, so the palette's trigger
 * shows ⌘K or Ctrl K from the first frame. Chosen after hydration, the label changed the
 * button's width and the header jumped on every page load.
 */
export const platformBootScript = `if(/Mac|iPhone|iPad/.test(navigator.userAgent))document.documentElement.dataset.platform='apple'`;
