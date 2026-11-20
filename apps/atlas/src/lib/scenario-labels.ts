/** What each recorded scenario does, in words, for the scenario list beside a replay. */
const fieldScenarioLabels: Readonly<Record<string, string>> = {
  'chip-tab': 'Tab from the last chip',
  'chip-shift-tab': 'Shift+Tab from the last chip',
  'chip-arrows': 'Arrows from the last chip',
  'tab-out': 'Tab from the input',
  'shift-tab-out': 'Shift+Tab from the input',
  'tab-from-chip': 'Left Arrow, then Tab',
  'backspace-twice': 'Backspace twice',
  arrows: 'Arrows from the input',
  'delete-focused': 'Left Arrow, then Delete',
  'remove-click': 'Click a remove button',
  // Combobox. `tab-out` is shared: Tab from the input means the same in both patterns.
  'tab-open': 'Tab with the list shown',
  'open-down': 'Down Arrow in the empty field',
  'type-then-move': 'Type a letter, then the arrow keys',
  ends: 'The arrow keys at both ends of the list',
  accept: 'Enter on an option',
  escape: 'Escape with the list shown',
  'open-up': 'Up Arrow in the empty field',
  'no-match': 'Text that matches nothing',
  reopen: 'Choose a value, then open the list again',
};

/**
 * A menu button reuses some scenario ids of the combobox (`tab-open`, `ends`, `escape`,
 * `open-down`, `open-up`) for keys pressed on a button and in a menu, so it has its own words:
 * "the list" or "the field" beside a menu's recording would name the wrong thing.
 */
const menuScenarioLabels: Readonly<Record<string, string>> = {
  'open-enter': 'Enter on the button',
  'open-space': 'Space on the button',
  'open-down': 'Down Arrow on the button',
  'open-up': 'Up Arrow on the button',
  move: 'Down Arrow, then Up Arrow',
  ends: 'The arrow keys at both ends of the menu',
  'home-end': 'Home and End',
  disabled: 'Enter where the disabled item is',
  escape: 'Escape with the menu shown',
  activate: 'Enter on an item',
  'tab-open': 'Tab with the menu shown',
  typeahead: 'A letter typed in the menu',
};

/** Tabs share ids with other patterns (`ends`, `move`, `home-end`) for keys on a tab list. */
const tabsScenarioLabels: Readonly<Record<string, string>> = {
  'tab-in': 'Tab into the tabs, a later tab active',
  'tab-in-back': 'Shift+Tab back into the tabs',
  'tab-out-text': 'Tab from a tab, its panel plain text',
  'tab-out-link': 'Tab from a tab, a link starts its panel',
  move: 'Right Arrow twice, then Left Arrow',
  ends: 'The arrow keys at both ends of the tabs',
  'activate-enter': 'Right Arrow, then Enter',
  'activate-space': 'Right Arrow, then Space',
  'vertical-keys': 'Down Arrow, then Up Arrow',
  'home-end': 'End, then Home',
};

const labelsByPattern: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'menu-button': menuScenarioLabels,
  tabs: tabsScenarioLabels,
};

/** The labels of one pattern's scenarios, for the scenario list beside a replay. */
export const scenarioLabelsOf = (patternId: string): Readonly<Record<string, string>> =>
  labelsByPattern[patternId] ?? fieldScenarioLabels;
