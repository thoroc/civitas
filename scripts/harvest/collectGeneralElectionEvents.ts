import type { Event } from './schemas';

export const collectGeneralElectionEvents = (
  elections: { date: string; label: string }[]
): Event[] =>
  elections.map(ge => ({
    date: ge.date,
    type: 'generalElection' as const,
    note: ge.label,
  }));
