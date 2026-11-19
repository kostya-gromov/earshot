import type { Pattern } from '../../src/index.ts';

export interface CitedSource {
  /** The page without its fragment: one snapshot per page. */
  page: string;
  /** Fragments cited on that page, each must exist as an id in the HTML. */
  fragments: string[];
  title: string;
  /** Where it is cited, for the report: "input-with-chips: rule bsp". */
  citedBy: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Every object with a w3.org `url` anywhere under `value`, with the path that led to it. */
function findSources(
  value: unknown,
  path: string[],
): { url: string; title: string; path: string[] }[] {
  if (Array.isArray(value)) return value.flatMap((item) => findSources(item, path));
  if (!isRecord(value)) return [];
  const url = value['url'];
  const here =
    typeof url === 'string' && url.startsWith('https://www.w3.org/')
      ? [{ url, title: typeof value['title'] === 'string' ? value['title'] : url, path }]
      : [];
  const label = typeof value['id'] === 'string' ? value['id'] : undefined;
  const children = Object.entries(value).flatMap(([key, child]) =>
    key === 'url' ? [] : findSources(child, label ? [...path, label] : path),
  );
  return [...here, ...children];
}

/**
 * The sources a pattern cites, read from the pattern itself, so the list can never drift from the
 * rules. Grouped by page, because a fragment is checked on the page that holds it.
 */
export function collectSources(patterns: readonly Pattern[]): CitedSource[] {
  const byPage = new Map<string, CitedSource>();
  for (const pattern of patterns) {
    for (const { url, title, path } of findSources(pattern, [])) {
      const [page = url, fragment] = url.split('#');
      const entry = byPage.get(page) ?? { page, fragments: [], title, citedBy: [] };
      if (fragment && !entry.fragments.includes(fragment)) entry.fragments.push(fragment);
      const where = path.join(': ');
      if (!entry.citedBy.includes(where)) entry.citedBy.push(where);
      byPage.set(page, entry);
    }
  }
  return [...byPage.values()].sort((a, b) => a.page.localeCompare(b.page));
}
