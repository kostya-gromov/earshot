'use client';

import { useEffect } from 'react';

/** The rule a link points at: "#rule-bsp", or an evidence card inside it, "#ev-bsp-fluent". */
function ruleFrom(href: string | null | undefined, ids: readonly string[]): string | undefined {
  const hash = href?.startsWith('#') ? decodeURIComponent(href.slice(1)) : '';
  return ids.find((id) => hash === `rule-${id}` || hash.startsWith(`ev-${id}-`));
}

/**
 * Selects the rule that the page's address, or a link the reader follows, points at, so no
 * link to a rule or one of its cards lands on a hidden panel.
 */
export function useLinkedRule(ids: readonly string[], select: (id: string) => void) {
  const key = ids.join(' ');
  useEffect(() => {
    const all = key.split(' ');
    const choose = (id: string | undefined) => {
      if (id) select(id);
    };
    choose(ruleFrom(location.hash, all));
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      choose(ruleFrom(link?.getAttribute('href'), all));
    };
    // The search follows a result by its address, with no link to click: the rule it names is
    // on this page when only the part after "#" changes.
    const onHash = () => choose(ruleFrom(location.hash, all));
    document.addEventListener('click', onClick);
    window.addEventListener('hashchange', onHash);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('hashchange', onHash);
    };
  }, [key, select]);
}
