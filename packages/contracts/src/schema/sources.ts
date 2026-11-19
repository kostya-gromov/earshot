import { z } from 'zod';
import { NonEmpty } from './primitives.ts';

const APG_BASE = 'https://www.w3.org/WAI/ARIA/apg/';
const WCAG_BASE = 'https://www.w3.org/WAI/WCAG22/Understanding/';

const urlUnder = (base: string) =>
  z.url().refine((url) => url.startsWith(base), { message: `URL must start with ${base}` });

const sourceFields = {
  title: NonEmpty,
  /** Date the link and its content were checked against the live page. */
  checkedAt: z.iso.date(),
  /**
   * Set when the rule does not apply the page directly: `related` (the page asks for something
   * near it, and the note says what) or `rationale` (cited for its reasoning). Left out, the rule
   * applies the page. The site lists such pages apart, never as requirements.
   */
  relation: z.enum(['related', 'rationale']).optional(),
  /** What the reader should know about the citation: why it is indirect, or where to look. */
  note: NonEmpty.optional(),
};

/** A page cited as related or as rationale must say why: the note is what the reader sees. */
const explained = <T extends { relation?: string | undefined; note?: string | undefined }>(
  source: T,
) => source.relation === undefined || source.note !== undefined;
const unexplained = { message: 'A related source needs a note that says why.', path: ['note'] };

/** Where a rule or requirement comes from. APG and WCAG links are pinned to their official bases. */
export const Source = z
  .discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('apg'), url: urlUnder(APG_BASE), ...sourceFields }),
    z.strictObject({
      kind: z.literal('wcag'),
      sc: z.string().regex(/^\d\.\d\.\d+$/, 'Success criterion number, for example 2.4.3'),
      url: urlUnder(WCAG_BASE),
      ...sourceFields,
    }),
    z.strictObject({ kind: z.literal('other'), url: z.url(), ...sourceFields }),
  ])
  .refine(explained, unexplained);
export type Source = z.infer<typeof Source>;

/** "No rule without a reason" (CLAUDE.md 2.3). */
export const Sources = z
  .array(Source)
  .min(1, 'Every rule and requirement needs at least one source');
