import { GENERAL_ELECTIONS } from './electionsBaseline.ts';

export type EventType = 'general' | 'by-election' | 'other' | 'unknown';

export type EventTypeLookup = {
  general: Set<string>;
  byElection: Set<string>;
};

const FALLBACK_GENERAL_DATES = new Set(GENERAL_ELECTIONS.map(e => e.date));

const FALLBACK_BY_ELECTION_DATES = new Set([
  '2005-07-14',
  '2006-02-09',
  '2007-07-19',
  '2008-06-26',
  '2008-11-06',
]);

const FALLBACK_OTHER_DATES = new Set<string>();

export const emptyLookup: EventTypeLookup = {
  general: new Set<string>(),
  byElection: new Set<string>(),
};

const toDateKey = (date: string): string => date.slice(0, 10);

export const classifyEventType = (
  date: string,
  lookup: EventTypeLookup = emptyLookup
): EventType => {
  const key = toDateKey(date);

  if (lookup.general.has(key)) return 'general';
  if (lookup.byElection.has(key)) return 'by-election';

  if (FALLBACK_GENERAL_DATES.has(key)) return 'general';

  if (FALLBACK_BY_ELECTION_DATES.has(key)) return 'by-election';

  if (FALLBACK_OTHER_DATES.has(key)) return 'other';

  return 'unknown';
};
