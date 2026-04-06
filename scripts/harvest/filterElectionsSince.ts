import type { ElectionEvent } from './electionsBaseline';

export const filterElectionsSince = (
  elections: ElectionEvent[],
  since: string
): ElectionEvent[] => elections.filter(e => e.date >= since);
