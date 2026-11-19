import { createHash } from 'node:crypto';

const ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
};

const decode = (text: string) =>
  text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&(\w+);/g, (match, name: string) => ENTITIES[name] ?? match);

/** The page's main content: the W3C pages wrap it in <main>; navigation and footers are noise. */
const mainOf = (html: string) => /<main[\s\S]*?<\/main>/i.exec(html)?.[0] ?? html;

/**
 * Readable text of a page, one block per line. Deterministic, so the same page gives the same
 * hash: the hash is how `sources:check` notices that a cited page changed.
 */
export function pageText(html: string): string {
  const withoutCode = mainOf(html)
    .replace(/<(script|style|svg|nav)[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const blocks = withoutCode
    .replace(/<(h[1-6])[^>]*>/gi, (_, tag: string) => `\n${'#'.repeat(Number(tag[1]))} `)
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/(p|div|section|li|h[1-6]|tr|dt|dd|pre|blockquote)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  return decode(blocks)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/** Ids in the page: a cited `#fragment` must be one of them, or the link lands at the top. */
export const pageIds = (html: string): Set<string> =>
  new Set([...html.matchAll(/\sid=["']([^"']+)["']/g)].map(([, id]) => id!));

export const textHash = (text: string): string =>
  createHash('sha256').update(text).digest('hex').slice(0, 16);
