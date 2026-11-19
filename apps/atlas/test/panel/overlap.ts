// One more probe of a rule's panel: what stays at the top of the window while the page scrolls
// must stay inside its own part of the panel.
import { note, panel, type Probe } from './probe';

/**
 * Scrolls through the whole panel in small steps: the list of systems never lies over the
 * system's evidence under the two columns (found by the design review of 2026-11-16, where the
 * list, kept at the top, travelled over the provenance line).
 */
export async function scrollThrough(probe: Probe) {
  const worst = await panel(probe.page).evaluate(async (root) => {
    const systems = root.querySelector('[role="group"][aria-label="Whose recording"]');
    const evidence = root.querySelector('[id^="ev-"]');
    if (!systems || !evidence) return 0;
    const start = root.getBoundingClientRect().top + scrollY;
    const end = start + root.getBoundingClientRect().height;
    let most = 0;
    for (let top = start - 100; top < end; top += 40) {
      scrollTo({ top, behavior: 'instant' });
      await new Promise(requestAnimationFrame);
      const [a, b] = [systems.getBoundingClientRect(), evidence.getBoundingClientRect()];
      const isBeside = a.right > b.left && a.left < b.right;
      const depth = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (isBeside) most = Math.max(most, Math.round(depth));
    }
    return most;
  });
  note(probe, 'systems-apart')(worst <= 0, `the systems lie ${worst} px over the evidence`);
}
