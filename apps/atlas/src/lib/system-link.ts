import { publicRepository } from './correction-link';

/** The issue form in `.github/ISSUE_TEMPLATE/`. Its field ids are the query parameters below. */
const template = 'system.yml';

/**
 * A new issue that suggests a public design system for one pattern. The title names the pattern
 * and ends where the person adds the system: as for corrections, the title must be enough on its
 * own, since filling a form's fields by id is documented without its exact syntax.
 */
export function systemSuggestionLink(patternId: string): string {
  const params = new URLSearchParams({
    template,
    title: `System for ${patternId}: `,
    pattern: patternId,
  });
  return `${publicRepository}/issues/new?${params.toString()}`;
}
