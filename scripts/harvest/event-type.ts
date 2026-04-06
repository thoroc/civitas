import type { TermStart } from '../lib';
import { runTermsQuery } from '../lib';
import {
  buildByElectionQuery,
  buildGeneralElectionQuery,
} from '../lib/wikidata';
import { emptyLookup } from './classify-event-type.ts';
import type { EventTypeLookup } from './classify-event-type.ts';

export type { EventType, EventTypeLookup } from './classify-event-type.ts';

const MIN_DATE = '2005-01-01';

const toDateKey = (date: string): string => date.slice(0, 10);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDates = (rows: TermStart[]): string[] =>
  rows
    .map(r => toDateKey(r.start))
    .filter(date => ISO_DATE.test(date))
    .filter(date => date >= MIN_DATE);

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
