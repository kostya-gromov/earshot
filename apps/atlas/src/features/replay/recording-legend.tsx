import type { ReplayStep } from '@/lib/replay';
import { ComboboxLegend } from './combobox-marks';
import { MenuLegend } from './menu-field';
import { hasDisabledItem, legendSigns } from './step-field';

interface RecordingLegendProps {
  /** One recording, or the recordings of several systems shown side by side. */
  recordings: readonly (readonly ReplayStep[])[];
}

/**
 * The legend a set of recordings needs, above its schematics: a menu's marks, a list's marks, or
 * none for chips, whose drawing has no marks to name. Only signs that occur are listed.
 */
export function RecordingLegend({ recordings }: RecordingLegendProps) {
  const steps = recordings.flat();
  if (steps.some(({ menu }) => menu)) {
    return <MenuLegend hasDisabled={hasDisabledItem(recordings)} />;
  }
  if (steps.some(({ combobox }) => combobox))
    return <ComboboxLegend {...legendSigns(recordings)} />;
  return null;
}
