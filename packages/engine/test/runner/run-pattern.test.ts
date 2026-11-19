import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { Measurement, checkMeasurementAgainstPattern } from '@earshot/contracts';
import { startServer } from '@earshot/reference/serve';
import { describe, expect, it } from 'vitest';
import { createReferenceAdapter } from '../../src/adapters/reference.ts';
import { createReferenceTarget } from '../../src/adapters/reference-target.ts';
import { executeRun } from '../../src/runner/execute-run.ts';
import { runPattern } from '../../src/runner/run-pattern.ts';
import { inputWithChipsSuite } from '../../src/suites/input-with-chips.ts';

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

const brokenReferenceTarget = {
  id: 'broken-reference',
  async open() {
    const root = fileURLToPath(new URL('../../../../', import.meta.url));
    const server = await startServer({ port: 0, root });
    const port = (server.address() as AddressInfo).port;
    const adapter = createReferenceAdapter(`http://localhost:${port}`);
    return {
      adapter: {
        ...adapter,
        id: 'broken-reference',
        url: `http://localhost:${port}/packages/engine/test/fixtures/input-with-chips-single-backspace.html`,
      },
      close: () => closeServer(server),
    };
  },
};

describe('runPattern', () => {
  it('measures the reference suite with every rule following', async () => {
    const result = await runPattern(inputWithChipsSuite, {
      targetId: 'reference',
      runs: 1,
      headed: false,
    });

    expect(result.status).toBe('measured');
    if (result.status !== 'measured') return;
    expect(() => Measurement.parse(result.measurement)).not.toThrow();
    expect(checkMeasurementAgainstPattern(result.measurement, inputWithChipsSuite.pattern)).toEqual(
      [],
    );
    expect(result.measurement.scenarios).toHaveLength(10);
    expect(result.measurement.provenance).toMatchObject({
      status: 'measured',
      runs: 1,
      consistent: true,
    });
    expect(
      Object.fromEntries(
        Object.entries(result.measurement.verdicts).map(([id, value]) => [id, value.verdict]),
      ),
    ).toEqual({
      'chip-stop': 'follows',
      'chip-arrows': 'follows',
      tab: 'follows',
      bsp: 'follows',
      arrows: 'follows',
      'keep-focus': 'follows',
      say: 'follows',
      count: 'follows',
    });
  }, 30_000);

  it('measures single-Backspace removal as differs', async () => {
    const result = await runPattern(
      { ...inputWithChipsSuite, targets: [brokenReferenceTarget] },
      { targetId: 'broken-reference', runs: 1, headed: false },
    );

    expect(result.status).toBe('measured');
    if (result.status !== 'measured') return;
    expect(result.measurement.verdicts.bsp).toEqual({
      verdict: 'differs',
      summary: 'First Backspace removes a chip',
      reason: '[backspace-twice] The first Backspace removed a chip immediately.',
      basis: [
        {
          scenario: 'backspace-twice',
          verdict: 'differs',
          summary: 'First Backspace removes a chip',
        },
      ],
    });
  }, 30_000);

  it('retains the reached state when execution fails after setup', async () => {
    const target = await createReferenceTarget(createReferenceAdapter).open();
    try {
      const scenario = inputWithChipsSuite.scenarios.find(({ id }) => id === 'remove-click')!;
      const execution = await executeRun(
        {
          ...target.adapter,
          resolveClickTarget: () =>
            Promise.resolve({ ok: false, reason: 'Deliberate click failure.' }),
        },
        scenario,
        false,
      );

      expect(execution.run).toMatchObject({
        status: 'errored',
        reason: 'Deliberate click failure.',
      });
      expect(execution.actualStateDescription).toBe('3 chips, empty input focused');
    } finally {
      await target.close();
    }
  }, 30_000);

  it('retains inconclusive runs when the target never becomes ready', async () => {
    const base = createReferenceTarget(createReferenceAdapter);
    const target = {
      ...base,
      id: 'not-ready',
      async open() {
        const session = await base.open();
        return {
          ...session,
          adapter: {
            ...session.adapter,
            id: 'not-ready',
            ready: () => Promise.reject(new Error('not ready')),
          },
        };
      },
    };

    const result = await runPattern(
      { ...inputWithChipsSuite, targets: [target] },
      { targetId: 'not-ready', runs: 1, headed: false },
    );

    expect(result.status).toBe('measured');
    if (result.status !== 'measured') return;
    expect(result.measurement.provenance.status).toBe('measured');
    if (result.measurement.provenance.status !== 'measured') return;
    expect(result.measurement.provenance.consistent).toBe(false);
    expect(result.measurement.target.systemVersion).toEqual({
      version: 'unknown',
      reason: 'Target was not ready: not ready',
    });
    expect(result.measurement.scenarios.every(({ runs }) => runs[0]?.status === 'errored')).toBe(
      true,
    );
    expect(
      Object.values(result.measurement.verdicts).every(({ verdict }) => verdict === 'inconclusive'),
    ).toBe(true);
  }, 30_000);
});
