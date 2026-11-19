'use client';

import { useState } from 'react';
import { Tabs } from '@/ui';
import { CodePane, type LineMark } from './code-pane';
import { CopyButtons } from './copy-buttons';
import type { LocatedNote } from './reference-notes';
import { useScrollEdges } from './use-scroll-edges';
import styles from './code-lens.module.css';

export interface SourceFile {
  name: string;
  html: string;
}

interface CodeViewProps {
  files: readonly SourceFile[];
  notes: readonly LocatedNote[];
  /** Base URL of the served reference files, for "Copy as JavaScript". */
  servedAt: string;
}

function Notes(props: {
  notes: readonly LocatedNote[];
  picked: number | undefined;
  onPick: (index: number) => void;
}) {
  const { ref, edges } = useScrollEdges<HTMLOListElement>();
  return (
    <ol
      ref={ref}
      className={styles.notes}
      aria-label="Notes"
      data-more-above={edges.above || undefined}
      data-more-below={edges.below || undefined}
    >
      {props.notes.map((note, index) => (
        <li key={note.title}>
          <button
            type="button"
            aria-pressed={props.picked === index}
            onClick={() => props.onPick(index)}
          >
            <b>{note.title}</b>
            <span>{note.text}</span>
            <small>
              {note.file}, line {note.line}
            </small>
          </button>
        </li>
      ))}
    </ol>
  );
}

/** The reference source with notes: picking a note opens its file and marks its lines. */
export function CodeView({ files, notes, servedAt }: CodeViewProps) {
  const [fileName, setFileName] = useState(files[0]?.name ?? '');
  const [picked, setPicked] = useState<number | undefined>(undefined);
  const note = picked === undefined ? undefined : notes[picked];
  const current = files.find(({ name }) => name === fileName);
  const mark = (name: string): LineMark | undefined =>
    note?.file === name ? { line: note.line, span: note.span } : undefined;

  return (
    <div className={styles.well}>
      <Tabs
        label="Files"
        variant="files"
        selectedId={fileName}
        onSelect={(name) => {
          setFileName(name);
          setPicked(undefined);
        }}
        toolbar={
          current && (
            <CopyButtons
              file={current.name}
              sourceUrl={`${servedAt}/${current.name}`}
              javascriptUrl={
                current.name.endsWith('.ts')
                  ? `${servedAt}/${current.name.replace(/\.ts$/, '.js')}`
                  : undefined
              }
            />
          )
        }
        aside={
          <Notes
            notes={notes}
            picked={picked}
            onPick={(index) => {
              setPicked(index);
              setFileName(notes[index]?.file ?? fileName);
            }}
          />
        }
        items={files.map(({ name, html }) => ({
          id: name,
          label: name,
          panel: <CodePane html={html} mark={mark(name)} />,
        }))}
      />
    </div>
  );
}
