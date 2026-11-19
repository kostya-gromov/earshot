'use client';

import { useEffect } from 'react';

const isReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** After the rule's panel and the chosen system have rendered: two frames, one for each update. */
const afterRender = (run: () => void) => requestAnimationFrame(() => requestAnimationFrame(run));

/**
 * Brings the rule's player into view: the recording and the list of systems, not the notes under
 * them. One scroll, smooth unless motion is reduced, and focus on the chosen system's button, a
 * real control, so a keyboard user continues from where the link led.
 */
function showPlayer(ruleId: string, system: string) {
  const player = document.getElementById(`player-${ruleId}`);
  if (!player) return;
  player.scrollIntoView({ block: 'start', behavior: isReduced() ? 'auto' : 'smooth' });
  player
    .querySelector<HTMLElement>(`[data-system="${CSS.escape(system)}"]`)
    ?.focus({ preventScroll: true });
}

interface LinkedSystem {
  ruleId: string;
  /** The systems this rule's player can show, as one string of ids joined by a space. */
  systems: string;
  select: (id: string) => void;
}

/**
 * Selects the system a link points at, "#ev-<rule>-<system>" (the verdict matrix links every
 * verdict this way), and brings that rule's player into view. The browser's own jump to the
 * anchor is cancelled: it ran before the panel was shown and fought with this scroll. The address
 * still changes, so the link can be shared.
 *
 * Only a system the player has counts. Other anchors share the prefix (a model's note is
 * "#ev-<rule>-model-<systems>"); taking one for a system chose a system that does not exist and
 * the recording disappeared (found 2026-11-13). Those links are left to the browser.
 */
export function useLinkedSystem({ ruleId, systems, select }: LinkedSystem) {
  useEffect(() => {
    const prefix = `ev-${ruleId}-`;
    const known = new Set(systems.split(' '));
    const systemIn = (href: string | null | undefined): string | undefined => {
      const hash = href?.startsWith('#') ? decodeURIComponent(href.slice(1)) : '';
      const system = hash.startsWith(prefix) ? hash.slice(prefix.length) : undefined;
      return system !== undefined && known.has(system) ? system : undefined;
    };
    const choose = (system: string) => {
      select(system);
      afterRender(() => showPlayer(ruleId, system));
    };
    const fromAddress = systemIn(location.hash);
    if (fromAddress) choose(fromAddress);
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      const href = link?.getAttribute('href');
      const system = systemIn(href);
      if (!system || !href) return;
      event.preventDefault();
      history.pushState(history.state, '', href);
      choose(system);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [ruleId, systems, select]);
}
