import { describe, expect, it } from 'vitest';
import { patterns, patternsInProgress } from '../src/index.ts';
import { collectSources } from '../scripts/sources/collect-sources.ts';
import { pageIds, pageText, textHash } from '../scripts/sources/page-text.ts';

describe('collectSources', () => {
  const sources = collectSources([
    ...Object.values(patterns),
    ...Object.values(patternsInProgress),
  ]);

  it('finds every cited page once, with its fragments', () => {
    const pages = sources.map((s) => s.page);
    expect(new Set(pages).size).toBe(pages.length);
    const keyboard = sources.find((s) => s.page.endsWith('practices/keyboard-interface/'));
    expect(keyboard?.fragments).toEqual(
      expect.arrayContaining(['kbd_roving_tabindex', 'focusabilityofdisabledcontrols']),
    );
  });

  it('says where each page is cited', () => {
    const status = sources.find((s) => s.page.endsWith('status-messages.html'));
    expect(status?.citedBy.join(' ')).toMatch(/input-with-chips/);
  });
});

describe('pageText', () => {
  const html = `<html><nav>skip</nav><main><h2 id="intent">Intent</h2>
    <p>Status messages &amp; focus.</p><script>x()</script><ul><li>One</li></ul></main>
    <footer>footer</footer></html>`;

  it('keeps the main content as readable lines and drops navigation and code', () => {
    expect(pageText(html)).toBe('## Intent\nStatus messages & focus.\n- One');
  });

  it('is stable, so the same page always has the same hash', () => {
    expect(textHash(pageText(html))).toBe(textHash(pageText(html)));
  });

  it('lists the ids a fragment can point at', () => {
    expect(pageIds(html).has('intent')).toBe(true);
  });
});
