'use client';

import { useState } from 'react';
import { CommandPalette, type PaletteItem } from '@/ui';
import styles from './lab.module.css';

/** On /lab, choosing a pattern reports the choice instead of navigating to a page that does not exist yet. */
export function PaletteDemo({ items }: { items: readonly PaletteItem[] }) {
  const [chosen, setChosen] = useState<string>();
  return (
    <div className={styles.specimens} data-testid="lab-palette">
      <CommandPalette noun="pattern" items={items} onChoose={(item) => setChosen(item.label)} />
      <p className={styles.note} role="status">
        {chosen ? `Chose ${chosen}` : ''}
      </p>
    </div>
  );
}
