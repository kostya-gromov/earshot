import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Measurement } from '@earshot/contracts';
import { describeMenuChange, menuOutside, menuSteps } from '../../src/lib/menu-replay';

// Read from the engine's own files, so the replay is tested on what was really recorded.
const folder = path.join(import.meta.dirname, '../../../../data', 'measurements', 'menu-button');
function scenario(adapter: string, id: string) {
  const file = readFileSync(path.join(folder, `${adapter}.json`), 'utf8');
  const run = Measurement.parse(JSON.parse(file)).scenarios.find((s) => s.id === id)?.runs[0];
  return menuSteps(run?.status === 'completed' ? run.steps : []);
}
const words = (adapter: string, id: string) => scenario(adapter, id).map(describeMenuChange);

describe('menuSteps', () => {
  it('follows the button, the items and the page’s line of the reference', () => {
    const steps = scenario('reference', 'activate');
    expect(steps.map(({ key }) => key)).toEqual(['Enter', 'ArrowDown', 'Enter']);
    expect(steps[0]?.before).toMatchObject({ focus: { kind: 'button' }, button: 'collapsed' });
    expect(
      steps[0]?.after.items.map(
        ({ name, isDisabled }) => `${name}${isDisabled ? ' disabled' : ''}`,
      ),
    ).toEqual(['Rename', 'Duplicate', 'Archive disabled', 'Delete']);
    expect(steps.at(-1)?.after).toMatchObject({
      focus: { kind: 'button' },
      items: [],
      lastAction: 'Last action: Duplicate',
    });
  });

  it('shows a button that is not in the tree while the menu is shown, as recorded', () => {
    const [open] = scenario('react-aria', 'escape');
    expect(open?.after.button).toBe('hidden');
    expect(scenario('react-aria', 'escape').at(-1)?.after.button).toBe('collapsed');
  });

  it('takes the active item from aria-activedescendant where focus is on the menu itself', () => {
    const [open] = scenario('chakra', 'open-enter');
    expect(open?.after.focus).toEqual({ kind: 'menu' });
    expect(open?.after.items.find(({ isActive }) => isActive)?.name).toBe('Rename');
  });

  it('is empty for a recording without a menu and the page’s line', () => {
    expect(menuSteps([])).toEqual([]);
  });
});

describe('describeMenuChange', () => {
  it('says what each step of the reference changed', () => {
    expect(words('reference', 'activate')).toEqual([
      'The menu opens with 4 items. Focus on “Rename”, 1 of 4. The button is exposed as expanded.',
      'Focus on “Duplicate”, 2 of 4.',
      'The menu closes. Focus on the button. The button is exposed as collapsed. The page says “Last action: Duplicate”.',
    ]);
  });

  it('says that nothing changes where a key does nothing: the finding itself', () => {
    expect(words('reference', 'disabled').at(-1)).toBe('Nothing changes.');
    expect(words('react-aria', 'tab-open').at(-1)).toBe('Nothing changes.');
  });

  it('names the disabled item when it becomes active', () => {
    expect(words('reference', 'disabled')[2]).toBe('Focus on “Archive”, 3 of 4, disabled.');
  });

  it('tells the active item from focus only where they differ', () => {
    // Chakra UI keeps focus on the menu and names its item with aria-activedescendant.
    expect(words('chakra', 'move').slice(0, 2)).toEqual([
      'The menu opens with 4 items. “Rename” active, 1 of 4. Focus on the menu itself. The button is exposed as expanded.',
      '“Duplicate” active, 2 of 4.',
    ]);
  });

  it('names where focus went when Tab left the menu', () => {
    expect(words('reference', 'tab-open').at(-1)).toBe(
      'The menu closes. Focus left the menu button: Note. The button is exposed as collapsed.',
    );
    expect(menuOutside(scenario('reference', 'tab-open'))).toBe('Note');
    expect(menuOutside(scenario('mui', 'tab-open'))).toBeUndefined();
  });
});
