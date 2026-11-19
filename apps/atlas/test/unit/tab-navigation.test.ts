import { describe, expect, it } from 'vitest';
import { nextTabIndex } from '../../src/ui/tabs/tab-navigation';

describe('nextTabIndex', () => {
  it('moves right and wraps from the last tab to the first', () => {
    expect(nextTabIndex(0, 'ArrowRight', 3)).toBe(1);
    expect(nextTabIndex(2, 'ArrowRight', 3)).toBe(0);
  });

  it('moves left and wraps from the first tab to the last', () => {
    expect(nextTabIndex(1, 'ArrowLeft', 3)).toBe(0);
    expect(nextTabIndex(0, 'ArrowLeft', 3)).toBe(2);
  });

  it('jumps to the ends with Home and End', () => {
    expect(nextTabIndex(1, 'Home', 3)).toBe(0);
    expect(nextTabIndex(1, 'End', 3)).toBe(2);
  });

  it('leaves other keys to the browser', () => {
    expect(nextTabIndex(1, 'Tab', 3)).toBeUndefined();
    expect(nextTabIndex(1, 'ArrowDown', 3)).toBeUndefined();
  });

  it('does nothing without tabs', () => {
    expect(nextTabIndex(0, 'ArrowRight', 0)).toBeUndefined();
  });
});
