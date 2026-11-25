import type { ReactNode } from 'react';
import styles from './home.module.css';

/** Who comes here and where each starts: the readers, said up front (2026-11-25). */
const routes = [
  { who: 'Choosing a library', label: 'See where systems differ', href: '#patterns' },
  {
    who: 'Building your own',
    label: 'Start from a pattern’s rules and reference',
    href: '/patterns/',
  },
  {
    who: 'Maintaining a design system',
    label: 'How to check a verdict and suggest a correction',
    href: '/methodology/#corrections',
  },
] as const;

interface HomeIntroProps {
  scene: ReactNode;
  /** Counted design systems across every pattern, each with its page. */
  systems: readonly { id: string; name: string }[];
}

/** ", " between names, " and " before the last, "." after it. */
const separator = (index: number, count: number) => {
  if (index === count - 1) return '.';
  return index === count - 2 ? ' and ' : ', ';
};

/** The measured systems by name, then a way in for each reader: under the scene, not over it. */
function WaysIn({ systems }: Pick<HomeIntroProps, 'systems'>) {
  return (
    <div className={styles.waysIn}>
      {/* Named, so a maintainer sees whether their system is here (first-visit review). */}
      <p className={styles.systems}>
        Measured so far:{' '}
        {systems.map(({ id, name }, index) => (
          <span key={id}>
            <a href={`/systems/${id}/`}>{name}</a>
            {separator(index, systems.length)}
          </span>
        ))}
      </p>
      <ul className={styles.routes} aria-label="Where to start">
        {routes.map(({ who, label, href }) => (
          <li key={who}>
            <span className={styles.who}>{who}</span>
            <a href={href}>{label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The opening, as few layers as the benchmark's (2026-11-25, with Linear beside it): who it
 * is for in one quiet line, the statement, one line on what is measured, room, then the scene, a
 * real recording with its finding in its own frame. The systems and the ways in follow the scene.
 */
export function HomeIntro({ scene, systems }: HomeIntroProps) {
  return (
    <section className={styles.intro} aria-labelledby="home-title">
      <div className={styles.statement}>
        <p className={styles.kicker}>Choosing a component library, or building your own?</p>
        <h1 id="home-title" className={styles.title}>
          Earshot measures what components expose to assistive technology.
        </h1>
        <p className={styles.lede}>
          Roles, names and states, focus and announcements, recorded after every key press and
          compared across design systems.
        </p>
      </div>
      <div className={styles.sceneWrap}>{scene}</div>
      <WaysIn systems={systems} />
    </section>
  );
}
