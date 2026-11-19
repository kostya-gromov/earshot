/**
 * What every pattern's tour has in common, so the rule set and the key listener do not know which
 * pattern they serve. The judging itself stays per pattern (chips-tour.ts, combobox-tour.ts):
 * the two change for different reasons.
 */

export interface TourStep {
  /** The rule this step tries; also the anchor of the rule further down the page. */
  id: string;
  /** Keys shown above the task; a step that is heard shows the heard marker instead. */
  keys: readonly string[];
  task: string;
}

export interface TourProgress {
  done: readonly string[];
}

/** A key with the field just before and just after it. */
export interface KeyObservation<Field> {
  key: string;
  before: Field;
  after: Field;
}

export interface TourDefinition<State extends TourProgress, Field> {
  steps: readonly TourStep[];
  initial: State;
  /**
   * The step completed by what is heard; it lights on announcements, not on keys. Undefined for
   * a pattern whose reference announces nothing (menu button: every line is focus landing).
   */
  heardRule: string | undefined;
  /** Reads the mounted reference. The only part that touches the DOM. */
  snapshot: (root: HTMLElement) => Field;
  observeKey: (state: State, observation: KeyObservation<Field>) => State;
  heardMessage: (state: State, text: string) => State;
  /** Rules a key exercises, given the field it was pressed in. */
  rulesLitBy: (key: string, field: Field) => readonly string[];
}

/** A tour with its own state and snapshot types hidden: what the shared UI holds. */
export type Tour = TourDefinition<TourProgress, unknown>;

/**
 * The one place the types are widened. Sound because a tour only ever receives the state and
 * the snapshots it produced itself.
 */
export function defineTour<State extends TourProgress, Field>(
  tour: TourDefinition<State, Field>,
): Tour {
  return {
    ...tour,
    observeKey: (state, observation) =>
      tour.observeKey(state as State, observation as KeyObservation<Field>),
    heardMessage: (state, text) => tour.heardMessage(state as State, text),
    rulesLitBy: (key, field) => tour.rulesLitBy(key, field as Field),
  };
}
