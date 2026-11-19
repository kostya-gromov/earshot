import { describe, expect, it } from 'vitest';
import { defaultMeasurementPath, runAllCommand, runCommand } from '../../src/cli/run.ts';
import { registeredPatterns } from '../../src/registry/index.ts';

describe('runCommand', () => {
  it('rejects an unknown pattern before launching a browser', async () => {
    await expect(
      runCommand({
        patternId: 'unknown',
        targetId: 'reference',
        runs: 1,
        headed: false,
      }),
    ).rejects.toThrow('Unknown pattern "unknown"');
  });

  it('builds the canonical measurement path', () => {
    expect(defaultMeasurementPath('input-with-chips', 'reference')).toBe(
      'data/measurements/input-with-chips/reference.json',
    );
  });
});

describe('runAllCommand', () => {
  // packages/engine/CLAUDE.md, Targets and conduct: one target at a time, a short delay between runs, no parallel hammering.
  it('measures every target in turn with a pause between them, and keeps going after a failure', async () => {
    const calls: string[] = [];
    const results = await runAllCommand({
      patternId: 'input-with-chips',
      runs: 3,
      headed: false,
      runOne: ({ targetId }) => {
        calls.push(`run ${targetId}`);
        if (targetId === 'chakra') return Promise.reject(new Error('Setup failed'));
        return Promise.resolve({ file: `${targetId}.json`, measurement: {} as never });
      },
      pause: () => {
        calls.push('pause');
        return Promise.resolve();
      },
    });

    const targets = registeredPatterns.get('input-with-chips')!.targetIds;
    expect(calls.filter((call) => call.startsWith('run'))).toEqual(
      targets.map((id) => `run ${id}`),
    );
    expect(calls.filter((call) => call === 'pause')).toHaveLength(targets.length - 1);
    expect(calls[0]).toBe(`run ${targets[0]}`);
    expect(results.find(({ targetId }) => targetId === 'chakra')).toEqual({
      targetId: 'chakra',
      error: 'Setup failed',
    });
    expect(results.filter((result) => 'file' in result)).toHaveLength(targets.length - 1);
  });

  it('rejects an unknown pattern before measuring anything', async () => {
    await expect(runAllCommand({ patternId: 'unknown', runs: 1, headed: false })).rejects.toThrow(
      'Unknown pattern "unknown"',
    );
  });
});
