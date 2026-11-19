import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import styles from './run-it.module.css';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: ReactNode;
  hint?: string;
  /** Shown under the field and tied to it with aria-describedby; marks it invalid. */
  error: string | undefined;
  inputRef: Ref<HTMLInputElement>;
}

/** A labelled input whose hint and error are part of its accessible description. */
export function FormField({ id, label, hint, error, inputRef, ...input }: FormFieldProps) {
  const describedBy = [hint && `${id}-hint`, `${id}-error`].filter(Boolean).join(' ');
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        {...input}
        ref={inputRef}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {hint && (
        <p className={styles.hint} id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <p className={styles.error} id={`${id}-error`}>
        {error}
      </p>
    </div>
  );
}
