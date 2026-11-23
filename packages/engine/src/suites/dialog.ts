import { dialog } from '@earshot/contracts';
import { createDialogReferenceAdapter } from '../adapters/dialog/reference.ts';
import {
  createAtlassianDialogTarget,
  createChakraDialogTarget,
  createFluentDialogTarget,
  createMuiDefaultFocusDialogTarget,
  createMuiDialogTarget,
  createPrimerDialogTarget,
  createReactAriaDefaultFocusDialogTarget,
  createReactAriaDialogTarget,
} from '../adapters/dialog/systems.ts';
import { createReferenceTarget } from '../adapters/reference-target.ts';
import { evaluateContained } from '../evaluators/dialog/contained.ts';
import { evaluateEscape } from '../evaluators/dialog/escape.ts';
import { evaluateFocusNotOnDialog } from '../evaluators/dialog/focus-not-on-dialog.ts';
import { evaluateModal } from '../evaluators/dialog/modal.ts';
import { evaluateNameMatchesTitle } from '../evaluators/dialog/name-matches-title.ts';
import { evaluateNamedDialog } from '../evaluators/dialog/named-dialog.ts';
import { evaluateOpenFocus } from '../evaluators/dialog/open-focus.ts';
import { evaluateOutsideInert } from '../evaluators/dialog/outside-inert.ts';
import { evaluateReturnFocus } from '../evaluators/dialog/return-focus.ts';
import { evaluateWrap } from '../evaluators/dialog/wrap.ts';
import { dialogScenarios } from '../scenarios/dialog.ts';
import { definePatternSuite } from './define-pattern-suite.ts';

/**
 * Who is charged once when a design goes wrong is decided inside the evaluators (dialog-rules.ts,
 * "One defect, one rule"), so the suite needs no preconditions. Systems are added once their
 * harness pages exist; the reference comes first and must follow every rule.
 */
export const dialogSuite = definePatternSuite({
  pattern: dialog,
  scenarios: dialogScenarios,
  evaluators: {
    'open-focus': evaluateOpenFocus,
    'focus-not-on-dialog': evaluateFocusNotOnDialog,
    contained: evaluateContained,
    wrap: evaluateWrap,
    escape: evaluateEscape,
    'return-focus': evaluateReturnFocus,
    'named-dialog': evaluateNamedDialog,
    'name-matches-title': evaluateNameMatchesTitle,
    modal: evaluateModal,
    'outside-inert': evaluateOutsideInert,
  },
  targets: [
    createReferenceTarget(createDialogReferenceAdapter),
    createReactAriaDialogTarget(),
    createReactAriaDefaultFocusDialogTarget(),
    createChakraDialogTarget(),
    createFluentDialogTarget(),
    createMuiDialogTarget(),
    createMuiDefaultFocusDialogTarget(),
    createPrimerDialogTarget(),
    createAtlassianDialogTarget(),
  ],
});
