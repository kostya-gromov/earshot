import type { Action, Run, Step } from '@earshot/contracts';
import type { Adapter } from '../adapters/adapter.ts';
import { readAxSubtree } from '../capture/ax-tree.ts';
import type { ScenarioDefinition, StepDefinition } from '../scenarios/types.ts';
import { buildStep } from './build-step.ts';
import { openSession } from './browser.ts';
import { observeStep } from './observe-step.ts';
import { centreOf, clickAt, coversCentre } from './click-at-centre.ts';
import { focusLastItem } from './start-on-item.ts';

interface RunExecution {
  run: Run;
  actualStateDescription?: string;
}

interface ResolvedAction {
  action: Action;
  performAction?: () => Promise<void>;
}

async function resolveAction<State, InteractionId extends string>(
  adapter: Adapter<State, InteractionId>,
  definition: StepDefinition<InteractionId>,
  page: Parameters<Adapter<State, InteractionId>['root']>[0],
): Promise<ResolvedAction | { error: string }> {
  if (definition.type !== 'click') return { action: definition };
  const resolved = await adapter.resolveClickTarget(page, definition.target);
  if (!resolved.ok) return { error: resolved.reason };
  if (resolved.atPoint) {
    if (adapter.dialog && (await coversCentre(adapter.dialog.locate(page), resolved.locator))) {
      // Expected, so a value: the scenario is not judged, and the reason says why.
      return {
        error: `The open dialog covers the point of the click on ${resolved.target.role ?? 'element'} "${resolved.target.name}": a click there is a click on the dialog, not outside it.`,
      };
    }
    // Read once, before the click: the point recorded is the point clicked.
    const point = await centreOf(resolved.locator);
    return {
      action: { type: 'click', target: resolved.target, at: 'point', point },
      performAction: () => clickAt(page, point),
    };
  }
  return {
    action: { type: 'click', target: resolved.target },
    performAction: () => resolved.locator.click(),
  };
}

/** The adapter's starting state, then where the scenario's steps begin. */
async function prepareStart<State, InteractionId extends string>(
  page: Parameters<Adapter<State, InteractionId>['root']>[0],
  adapter: Adapter<State, InteractionId>,
  scenario: ScenarioDefinition<State, InteractionId>,
) {
  const prepared = await adapter.setup(page, scenario.initialState);
  if (!prepared.ok || scenario.startOn !== 'last-item') return prepared;
  return focusLastItem(page, adapter, prepared);
}

export async function executeRun<State, InteractionId extends string>(
  adapter: Adapter<State, InteractionId>,
  scenario: ScenarioDefinition<State, InteractionId>,
  headed: boolean,
): Promise<RunExecution> {
  const session = await openSession({ headed });
  const steps: Step[] = [];
  let actualStateDescription: string | undefined;
  try {
    await session.page.goto(adapter.url);
    await adapter.ready(session.page);
    const setup = await prepareStart(session.page, adapter, scenario);
    if (!setup.ok) return { run: { status: 'setup-failed', reason: setup.reason } };
    actualStateDescription = setup.actualStateDescription;
    await adapter.root(session.page).evaluate((root) => window.__earshot.setRoot(root));
    const documentTitle = await session.page.title();
    let axBefore = await readAxSubtree(session.cdp);

    for (const definition of scenario.steps) {
      const resolved = await resolveAction(adapter, definition, session.page);
      if ('error' in resolved) {
        return {
          run: { status: 'errored', reason: resolved.error, steps },
          actualStateDescription,
        };
      }
      const observation = await observeStep(session, adapter, {
        action: resolved.action,
        axBefore,
        ...(resolved.performAction ? { performAction: resolved.performAction } : {}),
      });
      steps.push(buildStep(observation, documentTitle));
      axBefore = observation.axAfter;
    }
    return {
      run: { status: 'completed', steps },
      actualStateDescription,
    };
  } catch (error) {
    return {
      run: {
        status: 'errored',
        reason: error instanceof Error ? error.message : String(error),
        steps,
      },
      ...(actualStateDescription ? { actualStateDescription } : {}),
    };
  } finally {
    await session.close();
  }
}
