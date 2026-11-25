import { heardMessage, initialTour, observeKey, rulesLitBy } from './chips-tour';
import { snapshotCombobox } from './combobox-snapshot';
import {
  comboboxRulesLitBy,
  comboboxTourSteps,
  heardSuggestions,
  initialComboboxTour,
  observeComboboxKey,
} from './combobox-tour';
import { snapshotField } from './field-snapshot';
import { snapshotMenu } from './menu-snapshot';
import {
  heardNothing,
  initialMenuTour,
  menuRulesLitBy,
  menuTourSteps,
  observeMenuKey,
} from './menu-tour';
import { snapshotDialog } from './dialog-snapshot';
import {
  dialogRulesLitBy,
  dialogTourSteps,
  heardNothingInDialog,
  initialDialogTour,
  observeDialogKey,
} from './dialog-tour';
import { snapshotSelect } from './select-snapshot';
import {
  heardNothingInSelect,
  initialSelectTour,
  observeSelectKey,
  selectRulesLitBy,
  selectTourSteps,
} from './select-tour';
import { snapshotTabs } from './tabs-snapshot';
import {
  heardNothingInTabs,
  initialTabsTour,
  observeTabsKey,
  tabsRulesLitBy,
  tabsTourSteps,
} from './tabs-tour';
import { defineTour, type Tour } from './tour';
import { chipsTourSteps } from './tour-steps';

/** The tour of each pattern that has a playground, by pattern id. */
export const tours: Readonly<Record<string, Tour>> = {
  'input-with-chips': defineTour({
    steps: chipsTourSteps,
    initial: initialTour,
    heardRule: 'say',
    snapshot: snapshotField,
    observeKey,
    heardMessage,
    rulesLitBy,
  }),
  combobox: defineTour({
    steps: comboboxTourSteps,
    initial: initialComboboxTour,
    heardRule: 'say-results',
    snapshot: snapshotCombobox,
    observeKey: observeComboboxKey,
    heardMessage: heardSuggestions,
    rulesLitBy: comboboxRulesLitBy,
  }),
  'menu-button': defineTour({
    steps: menuTourSteps,
    initial: initialMenuTour,
    heardRule: undefined,
    snapshot: snapshotMenu,
    observeKey: observeMenuKey,
    heardMessage: heardNothing,
    rulesLitBy: menuRulesLitBy,
  }),
  tabs: defineTour({
    steps: tabsTourSteps,
    initial: initialTabsTour,
    heardRule: undefined,
    snapshot: snapshotTabs,
    observeKey: observeTabsKey,
    heardMessage: heardNothingInTabs,
    rulesLitBy: tabsRulesLitBy,
  }),
  dialog: defineTour({
    steps: dialogTourSteps,
    initial: initialDialogTour,
    heardRule: undefined,
    snapshot: snapshotDialog,
    observeKey: observeDialogKey,
    heardMessage: heardNothingInDialog,
    rulesLitBy: dialogRulesLitBy,
  }),
  select: defineTour({
    steps: selectTourSteps,
    initial: initialSelectTour,
    heardRule: undefined,
    snapshot: snapshotSelect,
    observeKey: observeSelectKey,
    heardMessage: heardNothingInSelect,
    rulesLitBy: selectRulesLitBy,
  }),
};
