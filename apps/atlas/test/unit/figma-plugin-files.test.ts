import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { pluginFiles } from '../../scripts/figma-plugin-files';

/* A stand-in for Figma's global, enough to start the joined script and send it a message. */
function fakeFigma() {
  const ui: { onmessage?: (sent: unknown) => void; resize: ReturnType<typeof vi.fn> } = {
    resize: vi.fn(),
  };
  return { ui, showUI: vi.fn(), closePlugin: vi.fn(), notify: vi.fn() };
}

function start(code: string) {
  const figma = fakeFigma();
  // The plugin's script is one classic script with two globals, as Figma runs it.
  runInNewContext(code, { figma, __html__: '<p>window</p>' });
  return figma;
}

describe('the plugin for Figma', () => {
  const files = pluginFiles({ hasAnnotations: false });

  it('is one script without modules that opens its window', () => {
    expect(files.code).not.toMatch(/^(import|export) /m);
    const figma = start(files.code);
    expect(figma.showUI).toHaveBeenCalledWith(
      '<p>window</p>',
      expect.objectContaining({ themeColors: true, title: 'Earshot Atlas' }),
    );
  });

  // The modules share one scope once joined: a second `function field` would replace the first.
  it('gives no two things in the joined script the same name', () => {
    const names = [...files.code.matchAll(/^(?:async )?(?:function|const) (\w+)/gm)].map(
      ([, name]) => name,
    );
    expect(names.filter((name, index) => names.indexOf(name) !== index)).toEqual([]);
  });

  it('closes when the window says so, and takes the height the window reports', () => {
    const figma = start(files.code);
    figma.ui.onmessage?.({ type: 'size', height: 241.5 });
    expect(figma.ui.resize).toHaveBeenCalledWith(320, 242);
    figma.ui.onmessage?.({ type: 'close' });
    expect(figma.closePlugin).toHaveBeenCalledOnce();
  });

  it('ignores a message that is not one of the window’s', () => {
    const figma = start(files.code);
    figma.ui.onmessage?.({ type: 'add' });
    figma.ui.onmessage?.('close');
    expect(figma.closePlugin).not.toHaveBeenCalled();
  });

  it('offers every pattern that has a drawing, with its count of requirements', () => {
    expect(files.window).toContain('value="input-with-chips" checked autofocus>Input with chips');
    expect(files.window).toContain('<span>(7 requirements)</span>');
    for (const name of ['Combobox', 'Menu button', 'Tabs', 'Modal dialog']) {
      expect(files.window).toContain(`>${name} <span>`);
    }
  });

  it('offers Figma annotations only in a build that asks for them', () => {
    expect(files.window).not.toContain('name="annotate"');
    expect(pluginFiles({ hasAnnotations: true }).window).toContain('name="annotate"');
  });

  it('declares that it asks the network for nothing', () => {
    expect(JSON.parse(files.manifest)).toMatchObject({
      ui: 'ui.html',
      documentAccess: 'dynamic-page',
      networkAccess: { allowedDomains: ['none'] },
    });
  });
});
