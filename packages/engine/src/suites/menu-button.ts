import { menuButton } from '@earshot/contracts';
import { createMenuButtonReferenceAdapter } from '../adapters/menu-button/reference.ts';
import {
  createAtlassianMenuTarget,
  createChakraMenuTarget,
  createFluentDefaultStoryMenuTarget,
  createFluentMenuTarget,
  createMuiMenuTarget,
  createPrimerMenuTarget,
  createReactAriaMenuTarget,
} from '../adapters/menu-button/systems.ts';
import { createReferenceTarget } from '../adapters/reference-target.ts';
import { evaluateActivate } from '../evaluators/menu-button/activate.ts';
import { evaluateArrows } from '../evaluators/menu-button/arrows.ts';
import { evaluateDisabled } from '../evaluators/menu-button/disabled.ts';
import { evaluateEscape } from '../evaluators/menu-button/escape.ts';
import { evaluateExpanded } from '../evaluators/menu-button/expanded.ts';
import { evaluateFocusReturns } from '../evaluators/menu-button/focus-returns.ts';
import { evaluateHomeEnd } from '../evaluators/menu-button/home-end.ts';
import { evaluateOpen } from '../evaluators/menu-button/open.ts';
import { evaluateTab } from '../evaluators/menu-button/tab.ts';
import { menuButtonScenarios } from '../scenarios/menu-button.ts';
import { definePatternSuite } from './define-pattern-suite.ts';

/**
 * Who is charged once when a design goes wrong is decided inside the evaluators, per scenario
 * (docs/patterns/menu-button.md, the ownership table), so the suite needs no preconditions.
 */
export const menuButtonSuite = definePatternSuite({
  pattern: menuButton,
  scenarios: menuButtonScenarios,
  evaluators: {
    open: evaluateOpen,
    expanded: evaluateExpanded,
    arrows: evaluateArrows,
    'home-end': evaluateHomeEnd,
    tab: evaluateTab,
    escape: evaluateEscape,
    activate: evaluateActivate,
    'focus-returns': evaluateFocusReturns,
    disabled: evaluateDisabled,
  },
  targets: [
    createReferenceTarget(createMenuButtonReferenceAdapter),
    createFluentMenuTarget(),
    createFluentDefaultStoryMenuTarget(),
    createMuiMenuTarget(),
    createReactAriaMenuTarget(),
    createChakraMenuTarget(),
    createPrimerMenuTarget(),
    createAtlassianMenuTarget(),
  ],
});
