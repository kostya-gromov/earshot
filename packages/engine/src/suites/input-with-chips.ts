import { inputWithChips } from '@earshot/contracts';
import { createAtlassianTarget } from '../adapters/atlassian/input-with-chips.ts';
import { createChakraTarget } from '../adapters/chakra/input-with-chips.ts';
import { createFluentTarget } from '../adapters/fluent/input-with-chips.ts';
import { createMuiTarget } from '../adapters/mui/input-with-chips.ts';
import { createPrimerTarget } from '../adapters/primer/input-with-chips.ts';
import { createReactAriaTarget } from '../adapters/react-aria/input-with-chips.ts';
import { createReferenceTarget } from '../adapters/reference-target.ts';
import { createReferenceAdapter } from '../adapters/reference.ts';
import { evaluateArrows } from '../evaluators/input-with-chips/arrows.ts';
import { evaluateBackspace } from '../evaluators/input-with-chips/bsp.ts';
import {
  chipArrowsPrecondition,
  evaluateChipArrows,
} from '../evaluators/input-with-chips/chip-arrows.ts';
import {
  chipStopPrecondition,
  evaluateChipStop,
} from '../evaluators/input-with-chips/chip-stop.ts';
import { evaluateCount } from '../evaluators/input-with-chips/count.ts';
import { evaluateKeepFocus } from '../evaluators/input-with-chips/keep-focus.ts';
import { evaluateSay } from '../evaluators/input-with-chips/say.ts';
import { evaluateTab } from '../evaluators/input-with-chips/tab.ts';
import { inputWithChipsScenarios } from '../scenarios/input-with-chips.ts';
import { definePatternSuite } from './define-pattern-suite.ts';

export const inputWithChipsSuite = definePatternSuite({
  pattern: inputWithChips,
  scenarios: inputWithChipsScenarios,
  evaluators: {
    'chip-stop': evaluateChipStop,
    'chip-arrows': evaluateChipArrows,
    tab: evaluateTab,
    bsp: evaluateBackspace,
    arrows: evaluateArrows,
    'keep-focus': evaluateKeepFocus,
    say: evaluateSay,
    count: evaluateCount,
  },
  preconditions: { 'chip-stop': chipStopPrecondition, 'chip-arrows': chipArrowsPrecondition },
  // Its two scenarios press one key each; when both follow, the rule is said whole.
  summaries: { 'chip-stop': 'The chips are one Tab stop' },
  targets: [
    createReferenceTarget(createReferenceAdapter),
    createAtlassianTarget(),
    createFluentTarget(),
    createPrimerTarget(),
    createMuiTarget(),
    createReactAriaTarget(),
    createChakraTarget(),
  ],
});
