import type { Pattern } from '@earshot/contracts';
import { SourceLinks } from '@/features/rules';
import { annotationText, annotationsText } from '@/lib/figma-annotation';
import { LensIntro } from '@/ui';
import { CopyAnnotation } from './copy-annotation';
import { InfoTip } from './info-tip';
import { RequirementVisual } from './requirement-visual';
import styles from './design-lens.module.css';

/** Where the requirements are, so a pasted annotation leads back to its reason and sources. */
const pathOf = (pattern: Pattern): string => `/patterns/${pattern.id}/#lens`;

function Requirements({ pattern }: { pattern: Pattern }) {
  return (
    <ul className={styles.list}>
      {pattern.requirements.map((requirement) => (
        <li key={requirement.id} className={styles.requirement}>
          <div className={styles.visual} aria-hidden="true">
            <RequirementVisual id={requirement.id} />
          </div>
          <div>
            <h4>
              {requirement.title}
              {requirement.level === 'guidance' && <span className={styles.tag}>Guidance</span>}
            </h4>
            <p>{requirement.reason}</p>
          </div>
          <div className={styles.sources}>
            <SourceLinks sources={requirement.sources} isCompact />
            <CopyAnnotation
              label="Copy for Figma"
              subject={requirement.title}
              what={`“${requirement.title}”`}
              text={annotationText(requirement)}
              path={pathOf(pattern)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** "For design": what accessibility asks of the design, each with its reason and source. */
export function DesignLens({ pattern }: { pattern: Pattern }) {
  const count = pattern.requirements.length;
  return (
    <div className={styles.lens}>
      <LensIntro title="Requirements">
        Decisions a designer has to make for this pattern. How to draw them stays with your team.
        Each copies as text for an annotation in Figma.
      </LensIntro>
      <div className={styles.all}>
        <CopyAnnotation
          label={`Copy all ${count} for Figma`}
          what={`${count} requirements`}
          text={annotationsText(pattern)}
          path={pathOf(pattern)}
          variant="boxed"
        />
        <InfoTip label="About copying for Figma">
          For now this copies plain text to paste into an annotation in Figma. Ready-made
          annotations are planned.
        </InfoTip>
      </div>
      <Requirements pattern={pattern} />
    </div>
  );
}
