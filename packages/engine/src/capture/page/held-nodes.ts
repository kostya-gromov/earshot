/*
 * In-page script (self-contained, no imports). Keeps the elements a locator found in page
 * memory, so the shell can ask the accessibility tree about each one without marking the DOM.
 */
(() => {
  const earshot = window.__earshot;
  const held = new Map<string, WeakRef<Element>[]>();

  earshot.holdNodes = (key, elements) => {
    held.set(
      key,
      elements.map((element) => new WeakRef(element)),
    );
    return elements.length;
  };
  earshot.heldNode = (key, index) => held.get(key)?.[index]?.deref() ?? null;
})();
