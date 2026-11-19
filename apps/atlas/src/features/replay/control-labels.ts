import type { ReplayStep } from '@/lib/replay';

export interface ControlLabels {
  /** Names the control before the field takes in the recording (Shift+Tab out of it). */
  before: readonly string[];
  /** Names the control after the field takes: its default and wherever Tab lands. */
  after: readonly string[];
}

/**
 * Every name the controls around the field take during a recording. The schematic sizes each
 * control to its longest name from the first frame, so a control renamed mid-replay ("Next"
 * becoming "Subject") never narrows the field and rewraps its chips (CLS).
 */
export function controlLabels(steps: readonly ReplayStep[], nextLabel: string): ControlLabels {
  const before = new Set<string>();
  const after = new Set<string>([nextLabel]);
  for (const { key, to } of steps) {
    if (to.kind !== 'outside') continue;
    (key.startsWith('Shift+') ? before : after).add(to.name || nextLabel);
  }
  return { before: [...before], after: [...after] };
}
