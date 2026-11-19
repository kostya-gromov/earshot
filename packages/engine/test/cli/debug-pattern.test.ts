import { expect, it, vi } from 'vitest';
import { debugPattern } from '../../src/cli/debug-pattern.ts';
import { inputWithChipsSuite } from '../../src/suites/input-with-chips.ts';

it('runs the declared click step when keys are not overridden', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  try {
    await debugPattern(inputWithChipsSuite, {
      targetId: 'reference',
      scenarioId: 'remove-click',
      headed: false,
      json: true,
    });

    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0]?.[0]).toContain('"type": "click"');
    expect(log.mock.calls[0]?.[0]).toContain('"name": "Remove Greg Fisher"');
  } finally {
    log.mockRestore();
  }
}, 30_000);
