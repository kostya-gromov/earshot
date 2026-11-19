import { registeredPatterns } from '../registry/index.ts';

export interface DebugOptions {
  patternId: string;
  targetId: string;
  scenarioId: string;
  keys?: string[];
  headed: boolean;
  json: boolean;
}

export async function runDebug(options: DebugOptions): Promise<void> {
  const registration = registeredPatterns.get(options.patternId);
  if (!registration) throw new Error(`Unknown pattern "${options.patternId}".`);
  await registration.debug({
    targetId: options.targetId,
    scenarioId: options.scenarioId,
    headed: options.headed,
    json: options.json,
    ...(options.keys ? { keys: options.keys } : {}),
  });
}
