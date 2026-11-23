import { z } from 'zod';
import { PatternId } from './primitives.ts';

/**
 * A file for Figma that the site offers for a pattern: where it is, and a fingerprint of the
 * requirements and the drawing it was saved from. The site compares the fingerprint with the
 * board as it would be drawn now, so a file older than its requirements cannot stay unnoticed.
 */
export const FigmaFile = z.object({
  file: z.string().regex(/^\/figma\/[a-z-]+\.fig$/),
  madeFrom: z.string().regex(/^[0-9a-f]{64}$/),
});
export type FigmaFile = z.infer<typeof FigmaFile>;

/** The files on the site, by pattern id. */
export const FigmaFiles = z.record(PatternId, FigmaFile);
export type FigmaFiles = z.infer<typeof FigmaFiles>;
