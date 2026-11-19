'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

/** Plays keys in the playground; `from` is the control that asked, so the reader can go back. */
type Play = (keys: readonly string[], from?: HTMLElement) => void;

interface PlaygroundLink {
  register: (play: Play) => () => void;
  play: Play;
}

const LinkContext = createContext<PlaygroundLink | undefined>(undefined);

/**
 * Lets parts of the page far from the playground (the reference's evidence card) play recorded
 * keys into it. The playground registers itself; nothing else holds a handle to the component.
 */
export function PlaygroundLinkProvider({ children }: { children: ReactNode }) {
  const current = useRef<Play | undefined>(undefined);
  const link = useMemo<PlaygroundLink>(
    () => ({
      register: (play) => {
        current.current = play;
        return () => {
          if (current.current === play) current.current = undefined;
        };
      },
      play: (keys, from) => current.current?.(keys, from),
    }),
    [],
  );
  return <LinkContext value={link}>{children}</LinkContext>;
}

/** The playground offers its replay to the rest of the page while it is mounted. */
export function useRegisterPlayground(play: Play) {
  const link = useContext(LinkContext);
  const latest = useRef(play);
  useEffect(() => {
    latest.current = play;
  });
  const stable = useCallback<Play>((keys, from) => latest.current(keys, from), []);
  useEffect(() => link?.register(stable), [link, stable]);
}

/** Plays keys in the playground; undefined when the page has no playground to play into. */
export function usePlayInPlayground(): Play | undefined {
  return useContext(LinkContext)?.play;
}
