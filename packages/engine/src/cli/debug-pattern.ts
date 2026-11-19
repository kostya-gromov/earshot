import type { Action } from '@earshot/contracts';
import type { Page } from '@playwright/test';
import type { Adapter } from '../adapters/adapter.ts';
import { readAxSubtree } from '../capture/ax-tree.ts';
import { openSession } from '../runner/browser.ts';
import { observeStep, type StepObservation } from '../runner/observe-step.ts';
import type { StepDefinition } from '../scenarios/types.ts';
import type { PatternSuite } from '../suites/types.ts';
import { formatStep } from './format.ts';

export interface PatternDebugOptions {
  targetId: string;
  scenarioId: string;
  keys?: readonly string[];
  headed: boolean;
  json: boolean;
}

async function resolveDebugAction<State, InteractionId extends string>(
  adapter: Adapter<State, InteractionId>,
  definition: StepDefinition<InteractionId>,
  page: Page,
): Promise<{ action: Action; performAction?: () => Promise<void> }> {
  if (definition.type !== 'click') return { action: definition };
  const resolved = await adapter.resolveClickTarget(page, definition.target);
  if (!resolved.ok) throw new Error(resolved.reason);
  return {
    action: { type: 'click', target: resolved.target },
    performAction: () => resolved.locator.click(),
  };
}

export async function debugPattern<State, InteractionId extends string>(
  suite: PatternSuite<State, InteractionId>,
  options: PatternDebugOptions,
): Promise<void> {
  const target = suite.targets.find(({ id }) => id === options.targetId);
  if (!target) throw new Error(`Unknown target "${options.targetId}".`);
  const scenario = suite.scenarios.find(({ id }) => id === options.scenarioId);
  if (!scenario) throw new Error(`Unknown scenario "${options.scenarioId}".`);

  const targetSession = await target.open();
  const browserSession = await openSession({ headed: options.headed });
  try {
    const { adapter } = targetSession;
    await browserSession.page.goto(adapter.url);
    await adapter.ready(browserSession.page);
    const setup = await adapter.setup(browserSession.page, scenario.initialState);
    if (!setup.ok) throw new Error(`Setup failed: ${setup.reason}`);
    await adapter.root(browserSession.page).evaluate((root) => window.__earshot.setRoot(root));

    const steps: StepObservation[] = [];
    let axBefore = await readAxSubtree(browserSession.cdp);
    const definitions = options.keys
      ? options.keys.map((key): StepDefinition<InteractionId> => ({ type: 'press', key }))
      : scenario.steps;
    for (const definition of definitions) {
      const resolved = await resolveDebugAction(adapter, definition, browserSession.page);
      const step = await observeStep(browserSession, adapter, {
        ...resolved,
        axBefore,
      });
      steps.push(step);
      axBefore = step.axAfter;
    }
    console.log(options.json ? JSON.stringify(steps, null, 2) : steps.map(formatStep).join('\n\n'));
  } finally {
    await browserSession.close();
    await targetSession.close();
  }
}
