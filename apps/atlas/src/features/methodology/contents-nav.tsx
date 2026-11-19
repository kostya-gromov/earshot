'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './methodology.module.css';

interface Entry {
  id: string;
  label: string;
}

/** The section the reader is in: the last one whose top has passed the upper part of the screen. */
function useCurrentSection(ids: readonly string[]): string | undefined {
  const [current, setCurrent] = useState<string>();
  const key = ids.join(' ');
  useEffect(() => {
    const sections = key.split(' ').flatMap((id) => document.getElementById(id) ?? []);
    const update = () => {
      const passed = sections.filter((section) => section.getBoundingClientRect().top < 160);
      setCurrent(passed.at(-1)?.id);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [key]);
  return current;
}

/**
 * True once the element has scrolled away above the screen (not while it is still below). Read
 * on scroll, not with an IntersectionObserver: a jump to a section takes the list from below the
 * screen to above it without ever showing it, and an observer reports only changes it sees.
 */
function useHasScrolledPast(ref: React.RefObject<HTMLElement | null>): boolean {
  const [hasPassed, setHasPassed] = useState(false);
  useEffect(() => {
    const update = () => setHasPassed((ref.current?.getBoundingClientRect().bottom ?? 1) < 0);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [ref]);
  return hasPassed;
}

/**
 * True while the site's footer is on screen. The floating "Contents" sat over the footer's
 * theme switch on a phone (design review 2026-11-19); at the footer the header's menu is in
 * reach, and "Contents" comes back on the way up.
 */
function useIsFooterInView(): boolean {
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const footer = document.querySelector('body footer');
    const update = () =>
      setIsInView((footer?.getBoundingClientRect().top ?? Infinity) < innerHeight);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return isInView;
}

/**
 * "On this page": every part, in order, with the current one marked. On a wide screen it stays
 * beside the text for the whole page; on a narrow one it sits at the top, and a small "Contents"
 * link appears once it has scrolled away, so there is always a way back (design review
 * 2026-11-13: after the first screen of eleven, nothing led back to the list).
 * The marker is neutral: blue means keyboard focus on this site.
 */
export function ContentsNav({ entries }: { entries: readonly Entry[] }) {
  const list = useRef<HTMLOListElement>(null);
  const current = useCurrentSection(entries.map(({ id }) => id));
  const hasPassedList = useHasScrolledPast(list);
  const isFooterInView = useIsFooterInView();
  return (
    <nav id="contents" className={styles.contents} aria-label="On this page">
      <div className={styles.rail}>
        <p className={styles.contentsLabel} aria-hidden="true">
          On this page
        </p>
        <ol ref={list}>
          {entries.map(({ id, label }) => (
            <li key={id}>
              <a href={`#${id}`} aria-current={id === current ? 'location' : undefined}>
                {label}
              </a>
            </li>
          ))}
        </ol>
      </div>
      {/* Always in the page, shown once the list is passed, so it can fade in and out. */}
      <a
        className={styles.backToContents}
        href="#contents"
        data-shown={(hasPassedList && !isFooterInView) || undefined}
      >
        Contents
      </a>
    </nav>
  );
}
