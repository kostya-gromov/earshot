import { systemSuggestionLink } from '@/lib/system-link';
import styles from './run-it.module.css';

interface SuggestSystemProps {
  patternId: string;
  scenarioCount: number;
}

/**
 * The path that works in phase 1: a public design system is suggested in a public issue, and
 * Earshot measures it under the inclusion rule (ADR 0006). The site itself sends nothing.
 */
export function SuggestSystem({ patternId, scenarioCount }: SuggestSystemProps) {
  return (
    <div className={styles.suggest}>
      <div>
        <h3 className={styles.suggestTitle}>Suggest a public design system</h3>
        <p className={styles.suggestText}>
          This path is open today. Name the system, and where its docs show this pattern, in a
          public issue on GitHub. If its maintainers ship a component for the pattern, or document
          one built from their own components, we write the adapter, the engine runs the same{' '}
          {scenarioCount} scenarios, and the system joins this page with its version, browser and
          date. If they do not, the issue is answered with the reason.
        </p>
      </div>
      <p className={styles.suggestLinks}>
        <a className={styles.suggestAction} href={systemSuggestionLink(patternId)}>
          Suggest a system on GitHub
        </a>
        <a href="/methodology/#systems">Which systems are measured</a>
      </p>
    </div>
  );
}
