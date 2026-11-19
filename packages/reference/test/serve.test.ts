import type { AddressInfo } from 'node:net';
import { expect, it } from 'vitest';
import { startServer } from '../scripts/serve.ts';

it('keeps the query string when it adds the trailing slash to a directory URL', async () => {
  const server = await startServer({ port: 0 });
  try {
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://localhost:${port}/input-with-chips?compare=a,b`, {
      redirect: 'manual',
    });
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/input-with-chips/?compare=a,b');
  } finally {
    server.close();
  }
});
