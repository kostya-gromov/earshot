/**
 * "What a screen reader says" for the live playground: a semantic model read from the DOM of the
 * reference, which sets its roles and names explicitly. Measured evidence uses the engine's lines
 * from Chromium's accessibility tree instead (ADR 0003, section 4). Labelled as a model in the UI.
 */

function roleOf(element: Element): string {
  const role = element.getAttribute('role');
  if (role) return role;
  if (element.localName === 'button') return 'button';
  if (element.localName === 'input') return 'textbox';
  return element.localName;
}

function nameOf(element: Element): string {
  const label = element.getAttribute('aria-label');
  if (label) return label;
  const labelled = element.id ? document.querySelector(`label[for="${element.id}"]`) : null;
  return (labelled ?? element).textContent?.trim() ?? '';
}

/** "3 of 3" for an item in a list, as screen readers say it for list items. */
export function positionOf(element: Element): string {
  const item = element.closest('li');
  if (!item?.parentElement) return '';
  const items = [...item.parentElement.children].filter((node) => node.localName === 'li');
  return `${items.indexOf(item) + 1} of ${items.length}`;
}

/** "expanded" or "collapsed", then "unavailable" for a disabled item, as the engine words them. */
function stateOf(element: Element): string {
  const expanded = element.getAttribute('aria-expanded');
  const states = [
    expanded === null ? '' : expanded === 'true' ? 'expanded' : 'collapsed',
    element.getAttribute('aria-disabled') === 'true' ? 'unavailable' : '',
  ];
  return states.filter(Boolean).join(', ');
}

/** "Apple, option, 1 of 3, selected": the active option, in the engine's words and order. */
export function optionLine(option: Element): string {
  const selected = option.getAttribute('aria-selected') === 'true' ? 'selected' : '';
  return [option.textContent?.trim() ?? '', 'option', positionOf(option), selected]
    .filter(Boolean)
    .join(', ');
}

const popupKinds = ['menu', 'listbox', 'tree', 'grid', 'dialog'];

/**
 * "has popup menu", for an aria-haspopup the element carries ("true" is a menu) when it says more
 * than the role already means: a combobox has a listbox by default, so that is not said. The
 * engine's rule and words (packages/engine, model/popup-kind.ts; methodology, "The semantic model").
 */
function popupOf(element: Element): string {
  const written = element.getAttribute('aria-haspopup');
  const kind = written === 'true' ? 'menu' : popupKinds.find((name) => name === written);
  const isDefault = roleOf(element) === 'combobox' && kind === 'listbox';
  return kind && !isDefault ? `has popup ${kind}` : '';
}

/** "Remove Greg Fisher, button, 2 of 2": name, role, popup, position, state, in the engine's order. */
export function focusLine(element: Element): string {
  return [nameOf(element), roleOf(element), popupOf(element), positionOf(element), stateOf(element)]
    .filter(Boolean)
    .join(', ');
}
