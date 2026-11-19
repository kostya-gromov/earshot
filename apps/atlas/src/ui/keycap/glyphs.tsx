import type { ReactElement } from 'react';

/**
 * Drawn glyphs for keys whose Unicode symbols render too small or inconsistently in system fonts
 * (found in D0). Each is a 16×16 stroke icon that inherits the keycap's text colour.
 */
const paths: Readonly<Record<string, ReactElement>> = {
  Backspace: (
    <>
      <path d="M6 3.5h7.5v9H6L2 8z" />
      <path d="m8 6 3 4m0-4-3 4" />
    </>
  ),
  Delete: (
    <>
      <path d="M10 3.5H2.5v9H10L14 8z" />
      <path d="m5 6 3 4m0-4-3 4" />
    </>
  ),
  ArrowLeft: <path d="M13 8H3m4-4L3 8l4 4" />,
  ArrowRight: <path d="M3 8h10M9 4l4 4-4 4" />,
  ArrowUp: <path d="M8 13V3M4 7l4-4 4 4" />,
  ArrowDown: <path d="M8 3v10m-4-4 4 4 4-4" />,
  Shift: <path d="M8 2.5 2.5 8.5H5.5v5h5v-5h3z" />,
  Enter: <path d="M13 3v5.5H3.5m3-3-3 3 3 3" />,
};

export const hasGlyph = (key: string): boolean => key in paths;

export function Glyph({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
