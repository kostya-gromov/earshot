'use client';

import { useState } from 'react';
import styles from './code-lens.module.css';

interface CopyButtonsProps {
  file: string;
  /** Where the file is served as written; fetched only when someone copies it. */
  sourceUrl: string;
  /** Where the browser build of a .ts file is served; the same text the playground runs. */
  javascriptUrl: string | undefined;
}

/** "Copy file" and "Copy as JavaScript", with the outcome said in a status region. */
export function CopyButtons({ file, sourceUrl, javascriptUrl }: CopyButtonsProps) {
  const [status, setStatus] = useState('');
  async function copy(what: string, text: () => Promise<string>) {
    try {
      await navigator.clipboard.writeText(await text());
      setStatus(`Copied ${what}`);
    } catch {
      setStatus('Copy failed. Select the code and copy it with your keyboard.');
    }
  }
  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.button}
        onClick={() => void copy(file, async () => (await fetch(sourceUrl)).text())}
      >
        Copy file
      </button>
      {javascriptUrl && (
        <button
          type="button"
          className={styles.quietButton}
          onClick={() =>
            void copy(file.replace(/\.ts$/, '.js'), async () => (await fetch(javascriptUrl)).text())
          }
        >
          Copy as JavaScript
        </button>
      )}
      <p className="visually-hidden" role="status">
        {status}
      </p>
    </div>
  );
}
