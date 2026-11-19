/*
 * In-page script (self-contained, no imports). Tells the runner when the page has settled
 * after an action: two frames, then no DOM mutation for `quietMs` since the action and no running finite
 * animation, with a hard cap (ADR 0003, section 5).
 */
(() => {
  const earshot = window.__earshot;
  let lastMutationAt = 0;

  const observer = new MutationObserver(() => {
    lastMutationAt = performance.now();
  });
  const observe = (target: Node) =>
    observer.observe(target, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });
  observe(document);
  earshot.onShadowRoot(observe);

  const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const hasRunningAnimation = () =>
    document.getAnimations().some((animation) => {
      const end = animation.effect?.getComputedTiming().endTime;
      return animation.playState === 'running' && typeof end === 'number' && Number.isFinite(end);
    });

  earshot.waitForQuiet = async ({ quietMs, capMs }) => {
    const start = performance.now();
    await nextFrame();
    await nextFrame();
    for (;;) {
      const now = performance.now();
      const ms = Math.round(now - start);
      // Counted from the action, not from a change before it: a page that was already still
      // would close the step at once, before a text written on a timer arrives.
      const stillSince = Math.max(lastMutationAt, start);
      if (now - stillSince >= quietMs && !hasRunningAnimation()) return { ms, quiet: true };
      if (now - start >= capMs) return { ms, quiet: false };
      await new Promise((resolve) => setTimeout(resolve, 16));
    }
  };
})();
