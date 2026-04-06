import { byStart } from './by-start';
import type { Event, SeatSpell } from './schemas';

interface CollectConstituencyEventsOptions {
  constituencyGroups: Map<string, SeatSpell[]>;
  since: string;
  generalElectionSet: Set<string>;
}

export const collectConstituencyEvents = (
  opts: CollectConstituencyEventsOptions
): Event[] => {
  const { constituencyGroups, since, generalElectionSet } = opts;
  const events: Event[] = [];

  for (const [cid, spells] of Array.from(constituencyGroups.entries())) {
    spells.sort(byStart);
    for (let i = 0; i < spells.length; i++) {
      const s = spells[i];
      if (s.start >= since && !generalElectionSet.has(s.start)) {
        events.push({
          date: s.start,
          type: 'byElection',
          memberId: s.memberId,
          constituencyId: cid,
        });
      }
      const next = spells[i + 1];
      if (s.end && next && s.end < next.start) {
        events.push({ date: s.end, type: 'vacancyStart', constituencyId: cid });
        events.push({
          date: next.start,
          type: 'vacancyEnd',
          constituencyId: cid,
        });
      }
    }
  }

  return events;
};
