'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { FormField } from './form-field';
import { checkRunRequest } from './run-request';
import styles from './run-it.module.css';

type Problem = { message: string } | undefined;

/** Checks on submit, focuses the first field with a problem, and reports the outcome. */
function useRunForm() {
  const urlRef = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<Problem>(undefined);
  const [result, setResult] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const check = checkRunRequest({ url: urlRef.current?.value ?? '' });
    if (!check.ok) {
      setProblem(check);
      setResult('');
      urlRef.current?.focus();
      return;
    }
    setProblem(undefined);
    setResult(
      'The link looks right. Nothing was sent or fetched: running stories is not open yet.',
    );
  }

  return { urlRef, error: problem?.message, result, submit };
}

/**
 * Phase 1 has no backend (apps/atlas/CLAUDE.md): the form checks the address and says plainly that
 * nothing was sent or fetched. It asks for no email: we do not collect addresses before we can
 * run what people would give us (docs/proposals/run-it-setup.md, accepted 2026-11-08).
 */
export function RunForm({ storyName }: { storyName: string }) {
  const id = useId();
  const { urlRef, error, result, submit } = useRunForm();
  return (
    <form className={styles.form} noValidate onSubmit={submit}>
      <FormField
        id={`${id}-url`}
        label="Storybook story URL"
        hint="A public story with a play function. No logins."
        error={error}
        inputRef={urlRef}
        name="url"
        type="url"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        placeholder={`https://storybook.example.com/?path=/story/${storyName}`}
        required
      />
      <button className={styles.submit} type="submit">
        Check the link
      </button>
      <p className={styles.result} role="status">
        {result}
      </p>
    </form>
  );
}
