import { z } from 'zod';

export const EventTypeSchema = z.enum([
  'general',
  'by-election',
  'other',
  'unknown',
]);

const FALLBACK_GENERAL_DATES = new Set([
  '2005-05-05',
  '2010-05-06',
  '2015-05-07',
  '2017-06-08',
  '2019-12-12',
]);

const FALLBACK_BY_ELECTION_DATES = new Set([
  '2005-07-14',
  '2006-02-09',
  '2007-07-19',
  '2008-06-26',
  '2008-11-06',
]);

const FALLBACK_OTHER_DATES = new Set<string>();

const toDateKey = (value: string): string => value.slice(0, 10);

export const inferEventType = (
  value: string
): z.infer<typeof EventTypeSchema> => {
  const key = toDateKey(value);
  if (FALLBACK_GENERAL_DATES.has(key)) return 'general';
  if (FALLBACK_BY_ELECTION_DATES.has(key)) return 'by-election';
  if (FALLBACK_OTHER_DATES.has(key)) return 'other';
  return 'unknown';
};

export type EventType = z.infer<typeof EventTypeSchema>;
