import { byStart } from './by-start';
import type { Event, PartySpell } from './schemas';

interface CollectPartySwitchEventsOptions {
  partySpells: PartySpell[];
  since: string;
  generalElectionSet: Set<string>;
}

export const collectPartySwitchEvents = (
  opts: CollectPartySwitchEventsOptions
): Event[] => {
  const { partySpells, since, generalElectionSet } = opts;
  const events: Event[] = [];

  const partyGroups = new Map<number, PartySpell[]>();
  for (const ps of partySpells) {
    if (!partyGroups.has(ps.memberId)) partyGroups.set(ps.memberId, []);
    partyGroups.get(ps.memberId)?.push(ps);
  }

  for (const [mid, spells] of Array.from(partyGroups.entries())) {
    spells.sort(byStart);
    for (let i = 1; i < spells.length; i++) {
      const prev = spells[i - 1];
      const curr = spells[i];
      if (
        curr.partyId !== prev.partyId &&
        !generalElectionSet.has(curr.start) &&
        curr.start >= since
      ) {
        events.push({
          date: curr.start,
          type: 'partySwitch',
          memberId: mid,
          fromPartyId: prev.partyId,
          toPartyId: curr.partyId,
        });
      }
    }
  }

  return events;
};
