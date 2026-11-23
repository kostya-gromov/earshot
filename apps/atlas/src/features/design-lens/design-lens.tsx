import type { Pattern } from '@earshot/contracts';
import { figmaFiles } from '@/data/figma-files';
import { boardPins } from '@/lib/figma-board-pins';
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

/**
 * The plugin that draws this pattern in the designer's own file, said where they reach for
 * Figma. It is in Figma's review (docs/proposals/figma-plugin.md); once listed, this line
 * becomes the link to it. Only for a pattern the plugin has a drawing of.
 */
function PluginNote() {
  return (
    <p className={styles.plugin}>
      <strong>Figma plugin</strong>
      <span className={styles.tag}>In Figma’s review</span>
      Will add this pattern to your own file, with its requirements as numbered notes.
    </p>
  );
}

/** The end of the intro's last sentence on a page that has a file. */
const fileToo = '; the file has them all as notes on a drawing';

const textOnly =
  'For now this copies plain text to paste into an annotation in Figma. Ready-made annotations are planned.';

/* The notes are layers, not Figma's own annotations: those could be neither
   written nor read on the free plan (docs/proposals/figma-annotated-elements.md). */
const withFile =
  'The file is a drawing of the element with each requirement as a numbered note. The notes are ordinary layers and open on any Figma plan. Copy gives the same notes as text.';

/** "For design": what accessibility asks of the design, each with its reason and source. */
export function DesignLens({ pattern }: { pattern: Pattern }) {
  const count = pattern.requirements.length;
  const file = figmaFiles[pattern.id]?.file;
  // A pattern in progress: its requirements are written from its measurements, after them.
  if (count === 0) {
    return (
      <div className={styles.lens}>
        <LensIntro title="Requirements">
          Not written yet for this pattern. They are written from the measurements and reviewed
          before the page is published.
        </LensIntro>
      </div>
    );
  }
  return (
    <div className={styles.lens}>
      <LensIntro title="Requirements">
        Decisions a designer has to make for this pattern. How to draw them stays with your team.
        Each copies as text for an annotation in Figma{file && fileToo}.
      </LensIntro>
      <div className={styles.all}>
        {boardPins[pattern.id] && <PluginNote />}
        <CopyAnnotation
          label={`Copy all ${count} for Figma`}
          what={`${count} requirements`}
          text={annotationsText(pattern)}
          path={pathOf(pattern)}
          variant="boxed"
        />
        {file && (
          <a className={styles.copy} data-variant="quiet" href={file} download>
            Download Figma file
          </a>
        )}
        <InfoTip label={file ? 'About copying and the Figma file' : 'About copying for Figma'}>
          {file ? withFile : textOnly}
        </InfoTip>
      </div>
      <Requirements pattern={pattern} />
    </div>
  );
}
