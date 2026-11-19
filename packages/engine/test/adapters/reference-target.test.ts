import { expect, it } from 'vitest';
import { createReferenceTarget } from '../../src/adapters/reference-target.ts';
import { createReferenceAdapter } from '../../src/adapters/reference.ts';

it('opens a reference adapter on a temporary local server', async () => {
  const target = createReferenceTarget(createReferenceAdapter);
  expect(target.id).toBe('reference');

  const session = await target.open();
  try {
    expect(new URL(session.adapter.url).hostname).toBe('localhost');
    expect(new URL(session.adapter.url).port).not.toBe('');
  } finally {
    await session.close();
  }
});
