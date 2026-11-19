/*
 * In-page script, runs before any page script (addInitScript). Must stay self-contained:
 * no imports. Creates window.__earshot and makes shadow roots visible to the other scripts.
 *
 * Wrapping attachShadow is the only way to reach closed shadow roots, where many design
 * systems render their components (ADR 0003, evidence table).
 */
(() => {
  const roots = new WeakMap<Element, ShadowRoot>();
  const listeners: ((root: ShadowRoot) => void)[] = [];
  // The original, taken from its descriptor because we re-bind it ourselves below.
  const attachShadow = Object.getOwnPropertyDescriptor(Element.prototype, 'attachShadow')!
    .value as (this: Element, init: ShadowRootInit) => ShadowRoot;

  Element.prototype.attachShadow = function (this: Element, init: ShadowRootInit) {
    const root = attachShadow.call(this, init);
    roots.set(this, root);
    for (const listener of listeners) listener(root);
    return root;
  };

  // The other page scripts fill in the rest of the API.
  const earshot = {
    shadowRootOf: (host: Element) => host.shadowRoot ?? roots.get(host) ?? null,
    onShadowRoot: (listener: (root: ShadowRoot) => void) => {
      listeners.push(listener);
    },
    now: () => performance.now(),
  } as Window['__earshot'];

  Object.defineProperty(window, '__earshot', { value: earshot, enumerable: false });
})();
