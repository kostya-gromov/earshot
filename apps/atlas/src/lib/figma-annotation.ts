import type { Pattern, Requirement, Source } from '@earshot/contracts';

/*
 * A design requirement as the text of an annotation: what to do, why, and where it comes from.
 * Plain lines, no markup: it is pasted by hand into an annotation in Figma (or into a comment or
 * a ticket), and nothing is promised about how the place it lands in draws markup. Figma has no
 * documented way to make an annotation from the clipboard, so the text is what is copied, and
 * the designer puts it on their own layer (checked in Figma's docs, 2026-11-17).
 */

/** A source as a reader names it, with how it stands to the requirement when it is not its basis. */
export function sourceName(source: Source): string {
  const name =
    source.kind === 'wcag'
      ? `WCAG ${source.sc} ${source.title.replace(/^Understanding SC [\d.]+:\s*/, '')}`
      : source.kind === 'apg'
        ? `APG, ${source.title}`
        : source.title;
  // A page cited for what stands near the requirement is said to be that, as on the site.
  const relation = source.relation === undefined ? '' : ` (${source.relation})`;
  return `${name}${relation}`;
}

const sourceLine = (source: Source): string => `${sourceName(source)}: ${source.url}`;

/**
 * The requirement's title, with whose requirement it is when it is not WCAG's. `by` is the name
 * the advice goes under: the site's own by default; the Figma plugin passes the name it is
 * published under.
 */
export const annotationHeading = ({ title, level }: Requirement, by = 'Earshot'): string =>
  level === 'guidance' ? `${title} (${by} guidance, beyond WCAG)` : title;

/** One requirement: its title, its reason, a line per source. */
export function annotationText(requirement: Requirement): string {
  return [
    annotationHeading(requirement),
    requirement.reason,
    ...requirement.sources.map(sourceLine),
  ].join('\n');
}

/** Every requirement of a pattern, under one line that says what they are. */
export function annotationsText(pattern: Pattern): string {
  return [
    `Accessibility requirements for the design: ${pattern.name}`,
    ...pattern.requirements.map(annotationText),
  ].join('\n\n');
}
