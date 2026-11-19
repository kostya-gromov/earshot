import type { ScenarioDefinition } from './types.ts';

export interface ChipsState {
  selectedItemCount: number;
}

export type ChipsInteraction = 'second-remove-control';

const initialState: ChipsState = { selectedItemCount: 3 };
const requestedStateDescription = '3 selected items, empty input focused';

export const inputWithChipsScenarios: readonly ScenarioDefinition<ChipsState, ChipsInteraction>[] =
  [
    // The chips on their own (APG rules), starting on the last chip (added 2026-11-10).
    {
      id: 'chip-tab',
      rules: ['chip-stop'],
      requestedStateDescription,
      initialState,
      startOn: 'last-item',
      steps: [{ type: 'press', key: 'Tab' }],
    },
    {
      id: 'chip-shift-tab',
      rules: ['chip-stop'],
      requestedStateDescription,
      initialState,
      startOn: 'last-item',
      steps: [{ type: 'press', key: 'Shift+Tab' }],
    },
    {
      id: 'chip-arrows',
      rules: ['chip-arrows'],
      requestedStateDescription,
      initialState,
      startOn: 'last-item',
      steps: [
        { type: 'press', key: 'ArrowLeft' },
        { type: 'press', key: 'ArrowRight' },
      ],
    },
    {
      id: 'tab-out',
      rules: ['tab'],
      requestedStateDescription,
      initialState,
      steps: [
        { type: 'press', key: 'Tab' },
        { type: 'press', key: 'Shift+Tab' },
      ],
    },
    {
      // Chips usually precede the input, so a Tab stop per remove control shows up going backwards.
      id: 'shift-tab-out',
      rules: ['tab'],
      requestedStateDescription,
      initialState,
      steps: [{ type: 'press', key: 'Shift+Tab' }],
    },
    {
      id: 'tab-from-chip',
      rules: ['tab'],
      requestedStateDescription,
      initialState,
      steps: [
        { type: 'press', key: 'ArrowLeft' },
        { type: 'press', key: 'Tab' },
      ],
    },
    {
      id: 'backspace-twice',
      rules: ['bsp', 'keep-focus', 'say', 'count'],
      requestedStateDescription,
      initialState,
      steps: [
        { type: 'press', key: 'Backspace' },
        { type: 'press', key: 'Backspace' },
      ],
    },
    {
      id: 'arrows',
      rules: ['arrows'],
      requestedStateDescription,
      initialState,
      steps: [
        { type: 'press', key: 'ArrowLeft' },
        { type: 'press', key: 'ArrowLeft' },
        { type: 'press', key: 'ArrowRight' },
        { type: 'press', key: 'ArrowRight' },
      ],
    },
    {
      id: 'delete-focused',
      rules: ['keep-focus', 'say', 'count'],
      requestedStateDescription,
      initialState,
      steps: [
        { type: 'press', key: 'ArrowLeft' },
        { type: 'press', key: 'Delete' },
      ],
    },
    {
      id: 'remove-click',
      rules: ['keep-focus', 'say', 'count'],
      requestedStateDescription,
      initialState,
      steps: [{ type: 'click', target: 'second-remove-control' }],
    },
  ];
