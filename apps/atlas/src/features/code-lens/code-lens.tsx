import type { Measurement } from '@earshot/contracts';
import { compactTokens } from '@/data/compact-tokens';
import { highlightSource } from '@/data/highlight';
import { readReferenceSource } from '@/data/reference';
import { LensIntro } from '@/ui';
import { BehaviorContractView } from './behavior-contract-view';
import { CodeView } from './code-view';
import { referenceGuides } from './reference-guides';
import { locateNotes } from './reference-notes';

interface CodeLensProps {
  patternId: string;
  reference: Measurement | undefined;
}

/** "For code": the exact source the playground runs, with notes, then the behavior contract. */
export async function CodeLens({ patternId, reference }: CodeLensProps) {
  const guide = referenceGuides[patternId];
  if (!guide) return null;
  const files = await Promise.all(
    guide.files.map(async (name) => {
      const source = await readReferenceSource(patternId, name);
      return { name, source, html: await highlightSource(name, source) };
    }),
  );
  const compact = compactTokens(files.map(({ html }) => html));
  const notes = locateNotes(guide.notes, Object.fromEntries(files.map((f) => [f.name, f.source])));
  return (
    <div>
      <LensIntro title="Reference source">
        The exact code running in the playground: framework-free TypeScript, with the types removed
        for the browser. Select a note to see the lines it explains.
      </LensIntro>
      {/* React hoists this into the head once; the token classes come from compactTokens. */}
      <style href="code-tokens" precedence="default">
        {compact.css}
      </style>
      {/* Only the highlighted HTML goes to the client; sources are fetched when copied. */}
      <CodeView
        files={files.map(({ name }, index) => ({ name, html: compact.htmls[index] ?? '' }))}
        notes={notes}
        servedAt={`/reference/${patternId}`}
      />
      {reference && (
        <>
          <LensIntro title="Behavior contract">
            Generated from the reference measurement. The same steps run against every target.
          </LensIntro>
          <BehaviorContractView reference={reference} />
        </>
      )}
    </div>
  );
}
