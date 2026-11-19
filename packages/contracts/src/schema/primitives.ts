import { z } from 'zod';

export const NonEmpty = z.string().trim().min(1);
export const Slug = z.string().regex(/^[a-z][a-z0-9-]*$/, 'Use lowercase kebab-case');

export const PatternId = Slug;
export const RuleId = Slug;

type RefinementContext = z.core.$RefinementCtx;
type IssuePath = (string | number)[];

/** Adds a custom validation issue; keeps cross-field checks short and uniform. */
export function addIssue(ctx: RefinementContext, path: IssuePath, message: string): void {
  ctx.addIssue({ code: 'custom', path, message });
}

/** Reports every item whose key was already seen, at `<listPath>.<index>.<field>`. */
export function reportDuplicates<T>(
  ctx: RefinementContext,
  items: readonly T[],
  { listPath, field, keyOf }: { listPath: string; field: string; keyOf: (item: T) => string },
): void {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    const key = keyOf(item);
    if (seen.has(key)) addIssue(ctx, [listPath, index, field], `Duplicate ${field} "${key}"`);
    seen.add(key);
  });
}
