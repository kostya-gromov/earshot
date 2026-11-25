import { select } from '@earshot/contracts';
import { createAtlassianSelectTarget } from '../adapters/atlassian/select.ts';
import { createChakraSelectTarget } from '../adapters/chakra/select.ts';
import { createFluentSelectTarget } from '../adapters/fluent/select.ts';
import { createMuiSelectTarget } from '../adapters/mui/select.ts';
import { createReactAriaSelectTarget } from '../adapters/react-aria/select.ts';
import { createReferenceTarget } from '../adapters/reference-target.ts';
import { createNativeSelectAdapter } from '../adapters/select/native.ts';
import { createSelectReferenceAdapter } from '../adapters/select/reference.ts';
import { evaluateArrows } from '../evaluators/select/arrows.ts';
import { evaluateDown } from '../evaluators/select/down.ts';
import { evaluateEnter } from '../evaluators/select/enter.ts';
import { evaluateEscapeKeepsValue } from '../evaluators/select/escape-keeps-value.ts';
import { evaluateEscape } from '../evaluators/select/escape.ts';
import { evaluateExpanded } from '../evaluators/select/expanded.ts';
import { evaluateFocusStays } from '../evaluators/select/focus-stays.ts';
import { evaluateNameAndValue } from '../evaluators/select/name-and-value.ts';
import { evaluateNameIsLabel } from '../evaluators/select/name-is-label.ts';
import { evaluateSelected } from '../evaluators/select/selected.ts';
import { evaluateTab } from '../evaluators/select/tab.ts';
import { selectScenarios } from '../scenarios/select.ts';
import { definePatternSuite } from './define-pattern-suite.ts';

/**
 * Who is charged once when a design goes wrong is decided inside the evaluators
 * (docs/proposals/select.md, "One defect, one rule"), so the suite needs no preconditions.
 * Systems are added once their harness pages exist; the reference comes first.
 */
export const selectSuite = definePatternSuite({
  pattern: select,
  scenarios: selectScenarios,
  evaluators: {
    tab: evaluateTab,
    'name-and-value': evaluateNameAndValue,
    'name-is-label': evaluateNameIsLabel,
    down: evaluateDown,
    expanded: evaluateExpanded,
    'focus-stays': evaluateFocusStays,
    arrows: evaluateArrows,
    selected: evaluateSelected,
    enter: evaluateEnter,
    escape: evaluateEscape,
    'escape-keeps-value': evaluateEscapeKeepsValue,
  },
  targets: [
    createReferenceTarget(createSelectReferenceAdapter),
    createMuiSelectTarget(),
    createReactAriaSelectTarget(),
    createChakraSelectTarget(),
    createFluentSelectTarget(),
    createAtlassianSelectTarget(),
    // Evidence for native-select-first: a variant of the reference, never counted.
    createReferenceTarget(createNativeSelectAdapter, 'native-select'),
  ],
});
