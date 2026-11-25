import { comboboxFileOrder, comboboxNotes } from './combobox-notes';
import { dialogFileOrder, dialogNotes } from './dialog-notes';
import { menuButtonFileOrder, menuButtonNotes } from './menu-button-notes';
import { referenceFileOrder, referenceNotes, type ReferenceGuide } from './reference-notes';
import { selectFileOrder, selectNotes } from './select-notes';
import { tabsFileOrder, tabsNotes } from './tabs-notes';

/** The annotated reference of each pattern, by pattern id. */
export const referenceGuides: Readonly<Record<string, ReferenceGuide>> = {
  'input-with-chips': { files: referenceFileOrder, notes: referenceNotes },
  combobox: { files: comboboxFileOrder, notes: comboboxNotes },
  'menu-button': { files: menuButtonFileOrder, notes: menuButtonNotes },
  tabs: { files: tabsFileOrder, notes: tabsNotes },
  dialog: { files: dialogFileOrder, notes: dialogNotes },
  select: { files: selectFileOrder, notes: selectNotes },
};
