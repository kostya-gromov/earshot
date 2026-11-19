import { Fragment } from 'react';

/**
 * Text from the targets file with its identifiers in monospace: whatever sits between backticks
 * (an attribute, a prop, an id) is set as code, because mono is reserved for keys, code and
 * tokens (apps/atlas/CLAUDE.md). Text without backticks comes out unchanged.
 */
/** Up to this length a token is short enough to keep on one line at 390 px. */
const shortToken = 24;

export function InlineCode({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, index) =>
        // Odd parts are the ones between a pair of backticks.
        index % 2 === 1 ? (
          // A short token stays whole; a long one (an id) may still wrap.
          <code key={index} data-short={part.length <= shortToken || undefined}>
            {part}
          </code>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
