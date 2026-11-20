import { tabs } from '@earshot/contracts';
import { createReferenceTarget } from '../adapters/reference-target.ts';
import { createTabsReferenceAdapter } from '../adapters/tabs/reference.ts';
import {
  createAtlassianTabsTarget,
  createChakraTabsTarget,
  createFluentTabsTarget,
  createMuiTabsTarget,
  createReactAriaTabsTarget,
} from '../adapters/tabs/systems.ts';
import { evaluateActivate } from '../evaluators/tabs/activate.ts';
import { evaluateArrows } from '../evaluators/tabs/arrows.ts';
import { evaluatePanel } from '../evaluators/tabs/panel.ts';
import { evaluatePanelReachable } from '../evaluators/tabs/panel-reachable.ts';
import { evaluateSelected } from '../evaluators/tabs/selected.ts';
import { evaluateTabIn } from '../evaluators/tabs/tab-in.ts';
import { evaluateTabOut } from '../evaluators/tabs/tab-out.ts';
import { evaluateVerticalKeysFree } from '../evaluators/tabs/vertical-keys-free.ts';
import { evaluateWrap } from '../evaluators/tabs/wrap.ts';
import { tabsScenarios } from '../scenarios/tabs.ts';
import { definePatternSuite } from './define-pattern-suite.ts';

/**
 * Who is charged once when a design goes wrong is decided inside the evaluators (tabs-rules.ts,
 * "One defect, one rule"), so the suite needs no preconditions. Systems are added once their
 * harness pages exist; the reference comes first and must follow every rule.
 */
export const tabsSuite = definePatternSuite({
  pattern: tabs,
  scenarios: tabsScenarios,
  evaluators: {
    'tab-in': evaluateTabIn,
    'tab-out': evaluateTabOut,
    'panel-reachable': evaluatePanelReachable,
    arrows: evaluateArrows,
    wrap: evaluateWrap,
    activate: evaluateActivate,
    selected: evaluateSelected,
    panel: evaluatePanel,
    'vertical-keys-free': evaluateVerticalKeysFree,
  },
  targets: [
    createReferenceTarget(createTabsReferenceAdapter),
    createReactAriaTabsTarget(),
    createChakraTabsTarget(),
    createFluentTabsTarget(),
    createMuiTabsTarget(),
    createAtlassianTabsTarget(),
  ],
});
