import type { ReplayStep } from '@/lib/replay';
import { tabsLeavePage } from '@/lib/tabs-replay';
import { ComboboxLegend } from './combobox-marks';
import { dialogControls } from '@/lib/dialog-replay';
import { DialogLegend } from './dialog-field';
import { MenuLegend } from './menu-field';
import { TabsLegend } from './tabs-field';
import { hasDisabledItem, legendSigns } from './step-field';

interface RecordingLegendProps {
  /** One recording, or the recordings of several systems shown side by side. */
  recordings: readonly (readonly ReplayStep[])[];
}

/** True when the engine counted more controls in the dialog than the recording has names for. */
function hasUnnamedControl(recording: readonly ReplayStep[]): boolean {
  const steps = recording.flatMap(({ dialog }) => (dialog ? [dialog] : []));
  const count = steps[0]?.controlCount ?? 0;
  return count > dialogControls(steps).length;
}

/**
 * The legend a set of recordings needs, above its schematics: tabs' marks, a menu's marks, a list's marks, or
 * none for chips, whose drawing has no marks to name. Only signs that occur are listed.
 */
export function RecordingLegend({ recordings }: RecordingLegendProps) {
  const steps = recordings.flat();
  if (steps.some(({ tabs }) => tabs)) {
    const tabs = steps.flatMap((step) => (step.tabs ? [step.tabs] : []));
    return <TabsLegend leavesPage={tabsLeavePage(tabs)} />;
  }
  if (steps.some(({ dialog }) => dialog)) {
    const ends = steps.flatMap(({ dialog }) => (dialog ? [dialog.after.focus.kind] : []));
    return (
      <DialogLegend
        hasClick={steps.some(({ dialog }) => dialog?.clickedAt !== undefined)}
        leavesPage={ends.includes('away')}
        hasLoss={ends.includes('body')}
        hasUnnamed={recordings.some((recording) => hasUnnamedControl(recording))}
      />
    );
  }
  if (steps.some(({ menu }) => menu)) {
    return <MenuLegend hasDisabled={hasDisabledItem(recordings)} />;
  }
  if (steps.some(({ combobox }) => combobox))
    return <ComboboxLegend {...legendSigns(recordings)} />;
  return null;
}
