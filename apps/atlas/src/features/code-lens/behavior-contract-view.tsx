import type { Measurement } from '@earshot/contracts';
import { behaviorContract } from '@/lib/behavior-contract';
import styles from './code-lens.module.css';

/** The contract as text: focus in the focus colour, what is heard in violet (apps/atlas/CLAUDE.md). */
export function BehaviorContractView({ reference }: { reference: Measurement }) {
  return (
    <pre className={styles.contract} tabIndex={0} aria-label="Behavior contract">
      {behaviorContract(reference).map((line, index) => (
        <span key={index}>
          {line.map((part, partIndex) => (
            <span key={partIndex} data-kind={part.kind === 'plain' ? undefined : part.kind}>
              {part.text}
            </span>
          ))}
          {'\n'}
        </span>
      ))}
    </pre>
  );
}
