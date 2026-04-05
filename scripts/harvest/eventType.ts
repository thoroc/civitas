import type { TermStart } from '../lib/runTermsQuery.ts';
import { runTermsQuery } from '../lib/runTermsQuery.ts';
import {
  buildByElectionQuery,
  buildGeneralElectionQuery,
} from '../lib/wikidata/index.ts';
import { GENERAL_ELECTIONS } from './electionsBaseline.ts';

export type EventType = 'general' | 'by-election' | 'other' | 'unknown';

export type EventTypeLookup = {
  general: Set<string>;
  byElection: Set<string>;
};

const MIN_DATE = '2005-01-01';

const FALLBACK_GENERAL_DATES = new Set(GENERAL_ELECTIONS.map(e => e.date));

const FALLBACK_BY_ELECTION_DATES = new Set([
  '2005-07-14',
  '2006-02-09',
  '2007-07-19',
  '2008-06-26',
  '2008-11-06',
]);

const FALLBACK_OTHER_DATES = new Set<string>();

const toDateKey = (date: string): string => date.slice(0, 10);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDates = (rows: TermStart[]): string[] =>
  rows
    .map(r => toDateKey(r.start))
    .filter(date => ISO_DATE.test(date))
    .filter(date => date >= MIN_DATE);

const emptyLookup: EventTypeLookup = {
  general: new Set<string>(),
  byElection: new Set<string>(),
};

export const fetchWikidataEventTypeLookup =
  async (): Promise<EventTypeLookup> => {
    try {
      const [generalRows, byElectionRows] = await Promise.all([
        runTermsQuery(buildGeneralElectionQuery(), 'general-election'),
        runTermsQuery(buildByElectionQuery(), 'by-election'),
      ]);

      if (generalRows.length === 0) {
        console.warn('[eventType] general election query returned 0 rows');
      }
      if (byElectionRows.length === 0) {
        console.warn('[eventType] by-election query returned 0 rows');
      }

      return {
        general: new Set(normalizeDates(generalRows)),
        byElection: new Set(normalizeDates(byElectionRows)),
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[eventType] Wikidata lookup failed: ${msg}`);
      return emptyLookup;
    }
  };

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
