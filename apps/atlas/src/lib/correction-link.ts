import type { Measurement } from '@earshot/contracts';

/** Where corrections are filed and where the raw files can be read. */
export const publicRepository = 'https://github.com/kostya-gromov/earshot-atlas';

/** The issue form in `.github/ISSUE_TEMPLATE/`. Its field ids are the query parameters below. */
const template = 'correction.yml';

interface CorrectionTarget {
  measurement: Measurement;
  /** The measurement file, from the repository's root: "data/measurements/combobox/mui.json". */
  file: string;
  ruleId: string;
}

const versionOf = ({ systemVersion }: Measurement['target']): string =>
  'reason' in systemVersion ? 'version unknown' : systemVersion.version;

/**
 * A new issue on the public repository, filled in with what the card shows. The title alone
 * names the system, version and rule: GitHub documents `title` as a query parameter, and filling
 * a form's fields by their id is documented without its exact syntax, so the title must be
 * enough on its own (checked in GitHub's docs, 2026-11-19).
 */
export function correctionLink({ measurement, file, ruleId }: CorrectionTarget): string {
  const { target, pattern, provenance } = measurement;
  const version = versionOf(target);
  const verdict = measurement.verdicts[ruleId]?.verdict ?? 'no verdict';
  const params = new URLSearchParams({
    template,
    title: `Correction: ${target.system} ${version}, ${pattern} / ${ruleId}`,
    system: `${target.system} ${version}`,
    rule: `${pattern} / ${ruleId}`,
    verdict,
    measured:
      provenance.status === 'measured' ? provenance.measuredAt.slice(0, 10) : 'not measured',
    file: `${publicRepository}/blob/main/${file}`,
  });
  return `${publicRepository}/issues/new?${params.toString()}`;
}
