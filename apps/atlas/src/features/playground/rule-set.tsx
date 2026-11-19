'use client';

import { Keycap } from '@/ui';
import type { TourStep } from './tour';
import { useTourView } from './tour-context';
import styles from './rule-set.module.css';

function StepKeys({ step }: { step: TourStep }) {
  if (step.keys.length === 0) {
    return (
      <span className={styles.heard} aria-hidden="true">
        heard
      </span>
    );
  }
  return step.keys.map((key, index) => <Keycap key={`${index}-${key}`} keys={key} />);
}

interface RuleItemProps {
  step: TourStep;
  title: string | undefined;
  /** Completed by what is heard, so its line is the colour of speech. */
  isHeard: boolean;
  isLit: boolean;
  isDone: boolean;
}

function RuleItem({ step, title, isHeard, isLit, isDone }: RuleItemProps) {
  return (
    <li
      className={styles.rule}
      data-rule={step.id}
      data-heard={isHeard || undefined}
      data-lit={isLit || undefined}
    >
      <div className={styles.keys}>
        <StepKeys step={step} />
      </div>
      <p className={styles.step} data-done={isDone || undefined}>
        <span className={styles.tick} aria-hidden="true">
          <svg viewBox="0 0 16 16">
            <path d="m4 8.5 2.5 2.5L12 5.5" />
          </svg>
        </span>
        <span className={styles.task}>{step.task}</span>
        {isDone && <span className="visually-hidden">Tried</span>}
      </p>
      <a className={styles.link} href={`#rule-${step.id}`}>
        <span className="visually-hidden">{title}: </span>Rule and evidence
      </a>
    </li>
  );
}

interface RuleSetProps {
  /** Rule titles from the pattern content, by id. */
  titles: Readonly<Record<string, string>>;
}

/** Four rules under the playground; each lights when exercised and is also a tour step. */
export function RuleSet({ titles }: RuleSetProps) {
  const view = useTourView();
  if (!view) return null;
  const { steps, heardRule, lit } = view;
  const { done } = view.progress;
  const last = done.at(-1);
  const total = steps.length;
  return (
    <section className={styles.ruleset} aria-labelledby="ruleset-title">
      <div className={styles.head}>
        <h2 id="ruleset-title" className={styles.title}>
          Try each rule
        </h2>
        <p className={styles.count}>
          <span>
            {done.length} of {total}
          </span>{' '}
          tried
        </p>
        <p className="visually-hidden" role="status">
          {last ? `Tried: ${titles[last] ?? last}. ${done.length} of ${total}.` : ''}
        </p>
      </div>
      <ol className={styles.rules}>
        {steps.map((step) => (
          <RuleItem
            key={step.id}
            step={step}
            title={titles[step.id]}
            isHeard={step.id === heardRule}
            isLit={lit.has(step.id)}
            isDone={done.includes(step.id)}
          />
        ))}
      </ol>
    </section>
  );
}
