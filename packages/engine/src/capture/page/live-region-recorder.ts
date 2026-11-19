/*
 * In-page script (self-contained, no imports). Records every text change of a live region,
 * from the moment the document exists, including inside shadow roots (ADR 0003, section 2).
 */
(() => {
  const earshot = window.__earshot;
  type Politeness = 'polite' | 'assertive';
  const buffer: ReturnType<Window['__earshot']['drainAnnouncements']> = [];
  const inserted: ReturnType<Window['__earshot']['drainInsertedRegions']> = [];
  const insertedAt = new WeakMap<Element, number>();
  const lastText = new WeakMap<Element, string>();
  const REGION_SELECTOR = '[aria-live], [role="status"], [role="alert"], [role="log"], output';

  function politenessOf(element: Element): Politeness | null {
    const live = element.getAttribute('aria-live');
    if (live === 'polite' || live === 'assertive') return live;
    if (live === 'off') return null;
    const role = element.getAttribute('role');
    if (role === 'alert') return 'assertive';
    if (role === 'status' || role === 'log' || element.localName === 'output') return 'polite';
    return null;
  }

  function regionOf(node: Node): Element | null {
    for (let current: Node | null = node; current; current = current.parentNode) {
      if (current instanceof Element && politenessOf(current)) return current;
    }
    return null;
  }

  // Screen readers do not announce regions that are not rendered or hidden from them.
  const isPerceivable = (region: Element) =>
    region.checkVisibility() && !region.closest('[aria-hidden="true"]');

  const textOf = (region: Element) => (region.textContent ?? '').replace(/\s+/g, ' ').trim();

  function noteInsertion(node: Node, t: number) {
    if (!(node instanceof Element)) return;
    for (const region of [node, ...node.querySelectorAll(REGION_SELECTOR)]) {
      const politeness = politenessOf(region);
      if (!politeness || insertedAt.has(region)) continue;
      insertedAt.set(region, t);
      // Kept apart from announcements: a region that arrives with its text is often not spoken.
      const text = textOf(region);
      if (text && isPerceivable(region)) inserted.push({ text, politeness, t });
    }
    // Declarative shadow DOM does not go through attachShadow.
    if (node.shadowRoot) observe(node.shadowRoot);
  }

  type Change = 'additions' | 'removals' | 'text';

  // aria-relevant decides which changes a screen reader speaks; the default is "additions text".
  function isRelevant(region: Element, changes: ReadonlySet<Change>): boolean {
    const tokens = (region.getAttribute('aria-relevant') ?? 'additions text').split(/\s+/);
    if (tokens.includes('all')) return true;
    return [...changes].some((change) => tokens.includes(change));
  }

  // A status or an alert is read whole; so is a region the author marks atomic.
  function isAtomic(region: Element): boolean {
    const atomic = region.getAttribute('aria-atomic');
    if (atomic !== null) return atomic === 'true';
    const role = region.getAttribute('role');
    return role === 'status' || role === 'alert';
  }

  /**
   * What a change adds to a region that keeps its earlier messages (a log an announcer appends
   * to): only the new part is spoken, so only the new part is recorded. A region that is read
   * whole, or whose text was replaced, is recorded whole.
   */
  function spokenPart(region: Element, text: string, before: string | undefined): string {
    if (!before || isAtomic(region) || !text.startsWith(before)) return text;
    return text.slice(before.length).trim();
  }

  function record(region: Element, changes: ReadonlySet<Change>, t: number) {
    const whole = textOf(region);
    const before = lastText.get(region);
    if (whole === before) return;
    lastText.set(region, whole);
    const text = spokenPart(region, whole, before);
    // Clearing a region before writing to it is a reset, not an announcement.
    const politeness = politenessOf(region);
    if (!text || !politeness || !isPerceivable(region) || !isRelevant(region, changes)) return;
    buffer.push({ text, politeness, t, regionInsertedAt: insertedAt.get(region) ?? t });
  }

  function changesOf(r: MutationRecord): Change[] {
    if (r.type === 'characterData') return ['text'];
    if (r.type !== 'childList') return [];
    return [
      ...(r.addedNodes.length > 0 ? (['additions'] as const) : []),
      ...(r.removedNodes.length > 0 ? (['removals'] as const) : []),
    ];
  }

  // A region that becomes live starts from its current text: making existing content live is
  // not an announcement (React Aria's TagGroup turns aria-live on when focus enters it).
  function noteBecameLive(r: MutationRecord) {
    if (r.type !== 'attributes' || !(r.target instanceof Element)) return;
    if (politenessOf(r.target) && !lastText.has(r.target)) lastText.set(r.target, textOf(r.target));
  }

  function onMutations(records: MutationRecord[]) {
    const t = performance.now();
    const touched = new Map<Element, Set<Change>>();
    for (const r of records) {
      r.addedNodes.forEach((node) => noteInsertion(node, t));
      if (r.type === 'attributes') noteInsertion(r.target, t); // became a region later
      noteBecameLive(r);
      const region = regionOf(r.target);
      if (!region) continue;
      const changes = touched.get(region) ?? new Set<Change>();
      changesOf(r).forEach((change) => changes.add(change));
      touched.set(region, changes);
    }
    touched.forEach((changes, region) => record(region, changes, t));
  }

  const observer = new MutationObserver(onMutations);
  function observe(target: Node) {
    observer.observe(target, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-live', 'role', 'hidden', 'aria-hidden'],
    });
  }

  observe(document);
  earshot.onShadowRoot(observe);
  earshot.drainAnnouncements = () => buffer.splice(0, buffer.length);
  earshot.drainInsertedRegions = () => inserted.splice(0, inserted.length);
})();
