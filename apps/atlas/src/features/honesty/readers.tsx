import styles from './how-to-read.module.css';

const readers = [
  {
    who: 'For design',
    what: 'Requirements with their reasons and sources, and where systems disagree.',
    link: {
      href: '/patterns/input-with-chips/?lens=design#lens',
      text: 'Input with chips, for design',
    },
  },
  {
    who: 'For code',
    what: 'A framework-free reference that follows every rule, and the behaviour contract the engine checks.',
    link: {
      href: '/patterns/input-with-chips/?lens=code#lens',
      text: 'Input with chips, for code',
    },
  },
  {
    who: 'For design system teams',
    what: 'Your component next to its peers, key by key, and how a wrong result gets corrected.',
    link: { href: '/methodology/#corrections', text: 'How corrections work' },
  },
];

/**
 * What each reader finds inside a pattern: a row each on hairlines, like the announced patterns,
 * with the way in as a plain link.
 */
export function Readers() {
  return (
    <div className={styles.readersBlock}>
      <h3 className={styles.readersTitle}>Who it is for</h3>
      <dl className={styles.readers}>
        {readers.map(({ who, what, link }) => (
          <div key={who} className={styles.reader}>
            <dt>{who}</dt>
            <dd>
              {what} <a href={link.href}>{link.text}</a>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
