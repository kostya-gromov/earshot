import { combobox } from '@earshot/contracts';
import { createComboboxReferenceAdapter } from '../adapters/combobox/reference.ts';
import { createAtlassianComboboxTarget } from '../adapters/atlassian/combobox.ts';
import { createChakraComboboxTarget } from '../adapters/chakra/combobox.ts';
import { createFluentComboboxTarget } from '../adapters/fluent/combobox.ts';
import { createMuiComboboxTarget } from '../adapters/mui/combobox.ts';
import { createPrimerComboboxTarget } from '../adapters/primer/combobox.ts';
import { createReactAriaComboboxTarget } from '../adapters/react-aria/combobox.ts';
import { createReferenceTarget } from '../adapters/reference-target.ts';
import { evaluateArrows } from '../evaluators/combobox/arrows.ts';
import { evaluateDown } from '../evaluators/combobox/down.ts';
import { evaluateEnter } from '../evaluators/combobox/enter.ts';
import { evaluateEscape } from '../evaluators/combobox/escape.ts';
import { evaluateExpanded } from '../evaluators/combobox/expanded.ts';
import { evaluateFocusStays } from '../evaluators/combobox/focus-stays.ts';
import { evaluateSayCount } from '../evaluators/combobox/say-count.ts';
import { evaluateSayResults } from '../evaluators/combobox/say-results.ts';
import { evaluateSelected } from '../evaluators/combobox/selected.ts';
import { evaluateTab } from '../evaluators/combobox/tab.ts';
import { comboboxScenarios } from '../scenarios/combobox.ts';
import { definePatternSuite } from './define-pattern-suite.ts';

/**
 * Who is charged once when a design goes wrong is decided inside the evaluators, per scenario
 * (docs/patterns/combobox.md, the ownership table), so the suite needs no preconditions.
 */
export const comboboxSuite = definePatternSuite({
  pattern: combobox,
  scenarios: comboboxScenarios,
  evaluators: {
    tab: evaluateTab,
    expanded: evaluateExpanded,
    down: evaluateDown,
    'focus-stays': evaluateFocusStays,
    arrows: evaluateArrows,
    selected: evaluateSelected,
    enter: evaluateEnter,
    escape: evaluateEscape,
    'say-results': evaluateSayResults,
    'say-count': evaluateSayCount,
  },
  targets: [
    createReferenceTarget(createComboboxReferenceAdapter),
    createMuiComboboxTarget(),
    createReactAriaComboboxTarget(),
    createChakraComboboxTarget(),
    createFluentComboboxTarget(),
    createPrimerComboboxTarget(),
    createAtlassianComboboxTarget(),
  ],
});
