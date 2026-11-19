/*
 * In-page script (self-contained, no imports). Finds the element that really has focus,
 * through open and closed shadow roots and same-origin iframes, and the facts about it that
 * only the DOM knows. Role, name and states come from the accessibility tree instead.
 */
(() => {
  const earshot = window.__earshot;
  let componentRoot: WeakRef<Element> | undefined;
  // Which element is which, apart from where it sits: a path changes when a sibling leaves.
  const numbers = new WeakMap<Element, number>();
  let lastNumber = 0;

  function numberOf(element: Element): number {
    const known = numbers.get(element);
    if (known !== undefined) return known;
    lastNumber += 1;
    numbers.set(element, lastNumber);
    return lastNumber;
  }

  function innerActive(element: Element): Element | null {
    const shadow = earshot.shadowRootOf(element);
    if (shadow?.activeElement) return shadow.activeElement;
    if (element instanceof HTMLIFrameElement) {
      try {
        return element.contentDocument?.activeElement ?? null;
      } catch {
        return null; // cross-origin frame: focus is inside, but we cannot see where
      }
    }
    return null;
  }

  /** Parent across shadow boundaries and out of iframes. */
  function composedParent(node: Node): Node | null {
    if (node.parentNode instanceof ShadowRoot) return node.parentNode.host;
    if (node.parentNode) return node.parentNode;
    return node instanceof Document ? (node.defaultView?.frameElement ?? null) : null;
  }

  function composedContains(ancestor: Element, node: Node): boolean {
    for (let current: Node | null = node; current; current = composedParent(current)) {
      if (current === ancestor) return true;
    }
    return false;
  }

  /** Short, stable selector for debugging. Never shown in the UI. */
  function pathOf(element: Element): string {
    const parts: string[] = [];
    for (let el: Element | null = element; el && parts.length < 5; el = el.parentElement) {
      const index = el.parentElement ? [...el.parentElement.children].indexOf(el) + 1 : 1;
      parts.unshift(el.id ? `${el.localName}#${el.id}` : `${el.localName}:nth-child(${index})`);
    }
    return parts.join(' > ');
  }

  const intAttribute = (element: Element, name: string) => {
    const value = Number.parseInt(element.getAttribute(name) ?? '', 10);
    return Number.isInteger(value) && value > 0 ? value : null;
  };

  /** What a text field holds. A password is never read, whatever the page under test is. */
  function textValueOf(element: Element): string | null {
    if (element instanceof HTMLTextAreaElement) return element.value;
    if (!(element instanceof HTMLInputElement) || element.type === 'password') return null;
    const textTypes = ['text', 'search', 'email', 'url', 'tel', 'number'];
    return textTypes.includes(element.type) ? element.value : null;
  }

  earshot.setRoot = (element) => {
    componentRoot = new WeakRef(element);
  };
  earshot.root = () => componentRoot?.deref() ?? null;

  earshot.deepActiveElement = () => {
    let active = document.activeElement;
    for (let inner = active && innerActive(active); inner; inner = innerActive(inner)) {
      active = inner;
    }
    return active;
  };

  earshot.describeFocus = (element) => {
    const root = earshot.root();
    return {
      isBody: element === element.ownerDocument.body,
      isInsideComponent: !!root && composedContains(root, element),
      path: pathOf(element),
      element: numberOf(element),
      ariaPosInSet: intAttribute(element, 'aria-posinset'),
      ariaSetSize: intAttribute(element, 'aria-setsize'),
      activeDescendantId: element.getAttribute('aria-activedescendant') || null,
      value: textValueOf(element),
      ariaHasPopup: element.getAttribute('aria-haspopup'),
    };
  };
})();
