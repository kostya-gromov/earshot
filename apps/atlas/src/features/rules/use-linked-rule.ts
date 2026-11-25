'use client';

import { useEffect } from 'react';

/** The rule a link points at: "#rule-bsp", or an evidence card inside it, "#ev-bsp-fluent". */
function ruleFrom(href: string | null | undefined, ids: readonly string[]): string | undefined {
  const hash = href?.startsWith('#') ? decodeURIComponent(href.slice(1)) : '';
  return ids.find((id) => hash === `rule-${id}` || hash.startsWith(`ev-${id}-`));
}

/**
 * Brings what the link points at into view once its panel is shown. The panel is hidden until
 * this runs, so the browser's own jump to "#rule-bsp" on load found nothing to scroll to and the
 * reader stayed at the top of the page (first-visit review, 2026-11-25). Under reduced motion
 * the jump is instant.
 */
function reveal(hash: string) {
  const target = document.getElementById(decodeURIComponent(hash.replace(/^#/, '')));
  if (!target) return;
  const isReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Two frames: the selected panel is shown by React's next render, then laid out.
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      target.scrollIntoView({ block: 'start', behavior: isReduced ? 'auto' : 'smooth' }),
    ),
  );
}

/**
 * Selects the rule that the page's address, or a link the reader follows, points at, so no
 * link to a rule or one of its cards lands on a hidden panel, and brings it into view.
 */
export function useLinkedRule(ids: readonly string[], select: (id: string) => void) {
  const key = ids.join(' ');
  useEffect(() => {
    const all = key.split(' ');
    const choose = (hash: string | null | undefined) => {
      const id = ruleFrom(hash, all);
      if (!id || !hash) return;
      select(id);
      reveal(hash);
    };
    choose(location.hash);
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      choose(link?.getAttribute('href'));
    };
    // The search follows a result by its address, with no link to click: the rule it names is
    // on this page when only the part after "#" changes.
    const onHash = () => choose(location.hash);
    document.addEventListener('click', onClick);
    window.addEventListener('hashchange', onHash);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('hashchange', onHash);
    };
  }, [key, select]);
}
