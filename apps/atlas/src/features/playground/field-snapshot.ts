import type { FieldSnapshot } from './chips-tour';

/** Reads the mounted reference: where focus is and how many chips there are. */
export function snapshotField(root: HTMLElement): FieldSnapshot {
  const input = root.querySelector('input');
  const active = document.activeElement;
  return {
    focusInField: active !== null && root.contains(active),
    focusOnInput: active === input,
    focusOnChip: Boolean(active?.closest('.chip')),
    inputEmpty: input?.value === '',
    chipCount: root.querySelectorAll('.chip').length,
  };
}

/** Two animation frames: the reference has moved focus and re-rendered. */
export const afterSettle = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
