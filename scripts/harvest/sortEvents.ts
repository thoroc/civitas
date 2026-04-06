import type { Event } from './schemas';

const typeOrder: Record<Event['type'], number> = {
  generalElection: 0,
  vacancyEnd: 1,
  byElection: 2,
  partySwitch: 3,
  seatChange: 4,
  vacancyStart: 5,
};

export const sortEvents = (events: Event[]): Event[] =>
  [...events].sort((a, b) =>
    a.date === b.date
      ? typeOrder[a.type] - typeOrder[b.type]
      : a.date < b.date
        ? -1
        : 1
  );
