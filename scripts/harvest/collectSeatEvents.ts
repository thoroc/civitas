import { byStart } from './byStart';
import { collectConstituencyEvents } from './collectConstituencyEvents';
import type { Event, SeatSpell } from './schemas';

interface CollectSeatEventsOptions {
  seatSpells: SeatSpell[];
  since: string;
  generalElectionSet: Set<string>;
}

export const collectSeatEvents = (opts: CollectSeatEventsOptions): Event[] => {
  const { seatSpells, since, generalElectionSet } = opts;
  const events: Event[] = [];

  const seatGroups = new Map<number, SeatSpell[]>();
  const constituencyGroups = new Map<string, SeatSpell[]>();

  for (const ss of seatSpells) {
    if (!constituencyGroups.has(ss.constituencyId))
      constituencyGroups.set(ss.constituencyId, []);
    constituencyGroups.get(ss.constituencyId)?.push(ss);
    if (!seatGroups.has(ss.memberId)) seatGroups.set(ss.memberId, []);
    seatGroups.get(ss.memberId)?.push(ss);
  }

  for (const [mid, spells] of Array.from(seatGroups.entries())) {
    spells.sort(byStart);
    for (let i = 1; i < spells.length; i++) {
      const prev = spells[i - 1];
      const curr = spells[i];
      if (
        prev.constituencyId !== curr.constituencyId &&
        curr.start >= since &&
        !generalElectionSet.has(curr.start)
      ) {
        events.push({
          date: curr.start,
          type: 'seatChange',
          memberId: mid,
          constituencyId: curr.constituencyId,
        });
      }
    }
  }

  return [
    ...events,
    ...collectConstituencyEvents({
      constituencyGroups,
      since,
      generalElectionSet,
    }),
  ];
};
