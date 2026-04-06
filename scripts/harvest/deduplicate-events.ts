import type { Event } from './schemas';

export const deduplicateEvents = (events: Event[]): Event[] => {
  const seen = new Set<string>();
  const dedup: Event[] = [];
  for (const ev of events) {
    const key = [
      ev.date,
      ev.type,
      ev.memberId || '',
      ev.constituencyId || '',
      ev.fromPartyId || '',
      ev.toPartyId || '',
    ].join('|');
    if (!seen.has(key)) {
      seen.add(key);
      dedup.push(ev);
    }
  }
  return dedup;
};
