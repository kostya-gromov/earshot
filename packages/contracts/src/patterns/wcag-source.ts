import type { Source } from '../schema/index.ts';

/**
 * A WCAG 2.2 Understanding page as a source, for the pattern whose links were checked on
 * `checkedAt`. Shared since the third pattern needed it (rule of three).
 */
export const wcagSource =
  (checkedAt: string) =>
  (sc: string, title: string, slug: string): Source => ({
    kind: 'wcag',
    sc,
    title: `Understanding SC ${sc}: ${title}`,
    url: `https://www.w3.org/WAI/WCAG22/Understanding/${slug}.html`,
    checkedAt,
  });
