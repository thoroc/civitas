import type { Event, EventTypeLookup } from '../harvest';

const typeOrder: Record<Event['type'], number> = {
  generalElection: 0,
  vacancyEnd: 1,
  byElection: 2,
  partySwitch: 3,
  seatChange: 4,
  vacancyStart: 5,
};

const addMissingEvents = (
  events: Event[],
  eventKeys: Set<string>,
  dates: Set<string>,
  type: Event['type'],
  since: string
): void => {
  for (const date of dates) {
    if (date < since) continue;
    const key = `${date}|${type}`;
    if (eventKeys.has(key)) continue;
    events.push({ date, type, note: 'wikidata' });
    eventKeys.add(key);
  }
};

export const mergeWikidataEvents = (
  events: Event[],
  lookup: EventTypeLookup,
  since: string
): void => {
  if (!lookup.general.size && !lookup.byElection.size) return;

  const eventKeys = new Set(events.map(ev => `${ev.date}|${ev.type}`));
  addMissingEvents(events, eventKeys, lookup.general, 'generalElection', since);
  addMissingEvents(events, eventKeys, lookup.byElection, 'byElection', since);

  events.sort((a, b) =>
    a.date === b.date
      ? typeOrder[a.type] - typeOrder[b.type]
      : a.date < b.date
        ? -1
        : 1
  );
};
