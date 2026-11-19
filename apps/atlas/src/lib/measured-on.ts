/** "7 Nov 2026": the measurement date as every card and label shows it, always in UTC. */
export const measuredOn = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
