import { describe, expect, it } from 'vitest';
import { notRunRuns } from '../../src/runner/not-run.ts';

const adapter = {
  notRun: {
    scenarios: ['move'],
    reason: "Not run: the engine cannot drive the browser's own list.",
  },
};

describe('notRunRuns', () => {
  it('writes "not run" with the reason in every run of a declared scenario', () => {
    expect(notRunRuns(adapter, 'move', 3)).toEqual(
      Array(3).fill({ status: 'not-run', reason: adapter.notRun.reason }),
    );
  });

  it('leaves every other scenario to be run', () => {
    expect(notRunRuns(adapter, 'tab-in', 3)).toBeUndefined();
    expect(notRunRuns({}, 'move', 3)).toBeUndefined();
  });
});
