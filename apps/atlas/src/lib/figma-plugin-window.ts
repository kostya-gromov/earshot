/*
 * The window of the Atlas plugin for Figma, as one HTML document: Figma shows it in a frame of
 * its own, with no access to the file. It lists the patterns that have a drawing and tells the
 * plugin which to add. Colours are Figma's own theme variables (showUI's themeColors), with
 * values for when they are absent. Only its text and background colours are used: all text is
 * the text colour, and the button is that colour reversed, so contrast does not rest on Figma's
 * secondary grey or on white over its brand blue (#0d99ff, under 4.5:1).
 */

export interface WindowPattern {
  id: string;
  name: string;
  /** How many requirements its board has. */
  notes: number;
}

const escaped = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const styles = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 16px;
    font: 12px / 1.5 Inter, system-ui, sans-serif;
    color: var(--figma-color-text, #1a1a1a);
    background: var(--figma-color-bg, #fff);
  }
  h1 { margin: 0 0 12px; font-size: 13px; font-weight: 600; line-height: 1.4; }
  fieldset { margin: 0 0 12px; padding: 0; border: 0; }
  legend { padding: 0; margin-bottom: 4px; font-weight: 500; }
  label { display: flex; align-items: center; gap: 8px; min-height: 28px; }
  input { width: 16px; height: 16px; margin: 0; accent-color: var(--figma-color-text, #1a1a1a); }
  p { margin: 0 0 12px; }
  .extra { align-items: flex-start; margin-bottom: 12px; }
  .extra input { flex: none; margin-top: 1px; }
  button {
    width: 100%;
    min-height: 32px;
    font: inherit;
    font-weight: 500;
    color: var(--figma-color-bg, #fff);
    background: var(--figma-color-text, #1a1a1a);
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
  }
  :focus-visible { outline: 2px solid var(--figma-color-text, #1a1a1a); outline-offset: 2px; }
  [role='status'] { min-height: 18px; margin: 8px 0 0; }
`;

/* Runs in the window. Escape closes it. The window reports the height of its content (the
   body's, not the frame's, which is never less than the frame), so Figma can fit it. */
const script = `
  const form = document.querySelector('form');
  const said = document.querySelector('[role="status"]');
  const tell = (message) => parent.postMessage({ pluginMessage: message }, '*');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const patterns = [...form.querySelectorAll('input[name="pattern"]:checked')].map(
      (input) => input.value,
    );
    if (patterns.length === 0) {
      said.textContent = 'Choose at least one pattern.';
      return;
    }
    said.textContent = 'Adding to the page.';
    tell({ type: 'add', patterns, annotate: form.elements.annotate?.checked ?? false });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') tell({ type: 'close' });
  });
  tell({ type: 'size', height: document.body.offsetHeight });
`;

function choice(pattern: WindowPattern, isFirst: boolean): string {
  const requirements = `${String(pattern.notes)} requirement${pattern.notes === 1 ? '' : 's'}`;
  const state = isFirst ? ' checked autofocus' : '';
  return `<label><input type="checkbox" name="pattern" value="${escaped(pattern.id)}"${state}>${escaped(pattern.name)} <span>(${requirements})</span></label>`;
}

const annotationsBox =
  '<label class="extra"><input type="checkbox" name="annotate">Also add Figma annotations <span>(needs a Full seat on a paid plan)</span></label>';

export interface WindowOptions {
  /** Whether to offer Figma's own annotations: off until that write has been seen to work. */
  hasAnnotations: boolean;
}

/** The window's document for these patterns; the first is chosen to begin with. */
export function pluginWindow(
  patterns: readonly WindowPattern[],
  { hasAnnotations }: WindowOptions,
): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Earshot Atlas</title><style>${styles}</style></head>
<body>
<main>
<form>
<h1>Add a pattern with its accessibility requirements</h1>
<fieldset><legend>Patterns</legend>
${patterns.map((pattern, index) => choice(pattern, index === 0)).join('\n')}
</fieldset>
<p>Each is added to this page as a new board: a drawing of the element with its requirements as numbered notes and their sources. Nothing else in the file changes.</p>
${hasAnnotations ? annotationsBox : ''}
<button type="submit">Add to this page</button>
<div role="status"></div>
</form>
</main>
<script>${script}</script>
</body>
</html>
`;
}
