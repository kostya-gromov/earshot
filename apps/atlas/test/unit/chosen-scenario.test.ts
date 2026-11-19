import { describe, expect, it } from 'vitest';
import { shownScenario } from '../../src/lib/chosen-scenario';

const recorded =
  (...ids: string[]) =>
  (id: string) =>
    ids.includes(id);

describe('shownScenario', () => {
  it('shows the scenario that decided the verdict while the person has chosen none', () => {
    expect(shownScenario(undefined, 'escape', recorded('escape', 'tab-open'))).toEqual({
      scenario: 'escape',
      missing: undefined,
    });
  });

  it('keeps the person’s own choice where the system recorded it', () => {
    expect(shownScenario('tab-open', 'escape', recorded('escape', 'tab-open'))).toEqual({
      scenario: 'tab-open',
      missing: undefined,
    });
  });

  it('falls back to the deciding scenario and names the choice it could not show', () => {
    expect(shownScenario('tab-open', 'escape', recorded('escape'))).toEqual({
      scenario: 'escape',
      missing: 'tab-open',
    });
  });

  it('names nothing when the choice that is not recorded is the deciding scenario itself', () => {
    expect(shownScenario('escape', 'escape', recorded())).toEqual({
      scenario: 'escape',
      missing: undefined,
    });
  });
});
