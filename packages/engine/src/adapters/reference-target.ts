import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { startServer } from '@earshot/reference/serve';
import type { TargetFactory } from '../suites/types.ts';
import type { Adapter } from './adapter.ts';

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

/**
 * The local reference of a pattern, served on a free port for the length of one measurement. `id`
 * names another page of the reference package (the browser's own select, a variant of the
 * reference); it defaults to the reference itself.
 */
export function createReferenceTarget<State, InteractionId extends string>(
  createAdapter: (baseUrl: string) => Adapter<State, InteractionId>,
  id = 'reference',
): TargetFactory<State, InteractionId> {
  return {
    id,
    async open() {
      const server = await startServer({ port: 0 });
      const port = (server.address() as AddressInfo).port;
      return {
        adapter: createAdapter(`http://localhost:${port}`),
        close: () => closeServer(server),
      };
    },
  };
}
