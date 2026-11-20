/**
 * The four tabs every tabs target is measured with, and what their panels hold, as on the
 * reference (docs/patterns/tabs.md, Scope). Members starts with a link, the only element in any
 * panel that takes focus: the rule "Tab reaches the shown panel" relies on it.
 */
export const tabNames = ['Overview', 'Activity', 'Members', 'Settings'] as const;
export type TabName = (typeof tabNames)[number];

/** A panel is one paragraph; where it has a link, the link comes first and `text` follows it. */
export const panelContent: Record<
  TabName,
  { link?: { href: string; text: string }; text: string }
> = {
  Overview: {
    text: 'Earshot Atlas measures how design systems behave for keyboard and screen reader users.',
  },
  Activity: { text: 'Recent changes to the project appear here.' },
  Members: {
    link: { href: '#members', text: 'Invite people' },
    text: ' to review the measurements with you.',
  },
  Settings: { text: 'Settings take effect on the next measurement.' },
};
