'use client';

import { comboboxPlaces } from '@/lib/combobox-replay';
import { menuOutside } from '@/lib/menu-replay';
import { replayStateAt, type ReplayStep } from '@/lib/replay';
import { ComboboxField } from './combobox-field';
import { MenuField } from './menu-field';
import { ReplayField } from './replay-field';

/** The longest list a set of recordings shows, in rows: the room a combobox replay reserves. */
export function listRows(recordings: readonly (readonly ReplayStep[])[]): number {
  const lengths = recordings.flatMap((steps) =>
    steps.flatMap(({ combobox, menu }) => [
      ...(combobox ? [combobox.before.options.length, combobox.after.options.length] : []),
      ...(menu ? [menu.before.items.length, menu.after.items.length] : []),
    ]),
  );
  return Math.max(0, ...lengths);
}

/** Which of a combobox replay's signs occur in a set of recordings, for its legend. */
export function legendSigns(recordings: readonly (readonly ReplayStep[])[]) {
  const steps = recordings.flat().flatMap(({ combobox }) => (combobox ? [combobox] : []));
  return {
    hasList: steps.some(({ before, after }) => before.options.length + after.options.length > 0),
    hasMessage: steps.some(({ written }) => written.length > 0),
  };
}

interface StepFieldProps {
  steps: readonly ReplayStep[];
  /** -1 is the starting state, before any key. */
  index: number;
  people: readonly string[];
  size?: 'md' | 'sm' | 'xs';
  /** False when no lane leaves the field in this scenario: no control beside it to draw. */
  hasControls?: boolean;
  /** Rows to reserve for a list, when several recordings share a row; default: this one's own. */
  rows?: number;
}

/** The list side of a recording at one step, with room kept for its longest list. */
function ComboboxStage({ steps, index, size, rows }: StepFieldProps) {
  const first = steps[0]?.combobox;
  if (!first) return null;
  const moment = index < 0 ? first.before : (steps[index]?.combobox?.after ?? first.before);
  return (
    <ComboboxField
      moment={moment}
      size={size === 'md' ? 'md' : 'sm'}
      rows={rows ?? listRows([steps])}
      places={comboboxPlaces(steps.flatMap(({ combobox }) => (combobox ? [combobox] : [])))}
      // Not on the starting frame: a list already there when the replay is first drawn does not fade.
      isLive={index >= 0}
    />
  );
}

/** Whether a set of menu recordings ever shows a disabled item, for the legend. */
export function hasDisabledItem(recordings: readonly (readonly ReplayStep[])[]): boolean {
  return recordings
    .flat()
    .some(({ menu }) => menu?.after.items.some(({ isDisabled }) => isDisabled) ?? false);
}

/** The menu side of a recording at one step, with room kept for its longest menu. */
function MenuStage({ steps, index, size, rows }: StepFieldProps) {
  const menus = steps.flatMap(({ menu }) => (menu ? [menu] : []));
  const first = menus[0];
  if (!first) return null;
  return (
    <MenuField
      moment={index < 0 ? first.before : (menus[index]?.after ?? first.before)}
      size={size === 'md' ? 'md' : 'sm'}
      rows={rows ?? listRows([steps])}
      outside={menuOutside(menus)}
      isLive={index >= 0}
    />
  );
}

/**
 * The schematic for a recording at one step: a field of chips, or, for a pattern with a popup,
 * the field with its list or the button with its menu. One component, so a player or a grid
 * cell draws any pattern.
 */
export function StepField(props: StepFieldProps) {
  const { steps, index, people, size = 'md', hasControls } = props;
  if (steps[0]?.menu) return <MenuStage {...props} size={size} />;
  if (steps[0]?.combobox) return <ComboboxStage {...props} size={size} />;
  return (
    <ReplayField
      state={replayStateAt(steps, index)}
      people={people}
      size={size}
      nextLabel="Next"
      steps={steps}
      {...(hasControls === undefined ? {} : { hasControls })}
    />
  );
}
