import type { Step } from '@earshot/contracts';
import { diffAxTrees } from '../diff/index.ts';
import { synthesizeSpeech } from '../speech/index.ts';
import type { StepObservation } from './observe-step.ts';

export function buildStep(observation: StepObservation, documentTitle: string): Step {
  const axDiff = diffAxTrees(observation.axBefore, observation.axAfter);
  return {
    action: observation.action,
    focusBefore: observation.focusBefore,
    focusAfter: observation.focusAfter,
    announcements: observation.announcements,
    ...(observation.insertedRegions.length > 0
      ? { insertedRegions: observation.insertedRegions }
      : {}),
    axDiff,
    settle: observation.settle,
    ...(observation.popup ? { popup: observation.popup } : {}),
    ...(observation.effect ? { effect: observation.effect } : {}),
    ...(observation.tabSet ? { tabSet: observation.tabSet } : {}),
    speech: synthesizeSpeech({
      documentTitle,
      focusBefore: observation.focusBefore,
      focusAfter: observation.focusAfter,
      announcements: observation.announcements,
    }),
  };
}
