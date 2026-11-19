import type { KeyObservation } from './tour';

interface Pending<Field> {
  id: number;
  key: string;
  before: Field;
}

export interface KeyObserver<Field> {
  /** A key went down; `now` is the field before it. Returns an id for its later settle. */
  keyDown: (key: string, now: Field) => number;
  /** The page settled after key `id`; `now` is the field after it, if no newer key came first. */
  settle: (id: number, now: Field) => void;
}

/**
 * Pairs each key with the field before and after it without relying on timing: the field just
 * before the next key is the field after this one. Fast typing (or Playwright) cannot make a key
 * see the effect of the key that followed it.
 */
export function createKeyObserver<Field>(
  observe: (observation: KeyObservation<Field>) => void,
): KeyObserver<Field> {
  let pending: Pending<Field> | undefined;
  let nextId = 0;
  const finish = (after: Field) => {
    if (!pending) return;
    observe({ key: pending.key, before: pending.before, after });
    pending = undefined;
  };
  return {
    keyDown(key, now) {
      finish(now);
      nextId += 1;
      pending = { id: nextId, key, before: now };
      return nextId;
    },
    settle(id, now) {
      if (pending?.id === id) finish(now);
    },
  };
}
