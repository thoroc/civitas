import type { ElectionEvent } from './elections-baseline';

export const filterElectionsSince = (
  elections: ElectionEvent[],
  since: string
): ElectionEvent[] => elections.filter(e => e.date >= since);
