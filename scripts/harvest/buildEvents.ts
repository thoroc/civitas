import { NormalizedData, Event, HarvestConfig, PartySpell, SeatSpell } from './types';
import { GENERAL_ELECTIONS } from './electionsBaseline';

function byStart<T extends { start: string }>(a: T, b: T) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; }

interface BuildEventsOptions {
  elections?: { date: string; label: string }[];
}

export function buildEvents(normalized: NormalizedData, cfg: HarvestConfig, opts: BuildEventsOptions = {}): Event[] {
  const elections = (opts.elections || GENERAL_ELECTIONS).filter(e => e.date >= cfg.since);
  const generalElectionSet = new Set(elections.map(e => e.date));
  const events: Event[] = [];

  // 1. General elections
  for (const ge of elections) {
    events.push({ date: ge.date, type: 'generalElection', note: ge.label });
  }

  // 2. Seat-based events (by-elections + vacancies + seatChange where same member moves seat)
  const seatGroups = new Map<number, SeatSpell[]>(); // group by member for seatChange, plus constituency groups separately
  const constituencyGroups = new Map<string, SeatSpell[]>();
  for (const ss of normalized.seatSpells) {
    if (!constituencyGroups.has(ss.constituencyId)) constituencyGroups.set(ss.constituencyId, []);
    constituencyGroups.get(ss.constituencyId)!.push(ss);
    if (!seatGroups.has(ss.memberId)) seatGroups.set(ss.memberId, []);
    seatGroups.get(ss.memberId)!.push(ss);
  }
  // seat changes (member has multiple seat spells with different constituency ids)
  for (const [mid, spells] of Array.from(seatGroups.entries())) {
    spells.sort(byStart);
    for (let i=1;i<spells.length;i++) {
      const prev = spells[i-1];
      const curr = spells[i];
      if (prev.constituencyId !== curr.constituencyId && curr.start >= cfg.since && !generalElectionSet.has(curr.start)) {
        events.push({ date: curr.start, type: 'seatChange', memberId: mid, constituencyId: curr.constituencyId });
      }
    }
  }
  for (const [cid, spells] of Array.from(constituencyGroups.entries())) {
    spells.sort(byStart);
    for (let i = 0; i < spells.length; i++) {
      const s = spells[i];
      if (s.start >= cfg.since && !generalElectionSet.has(s.start)) {
        // A new incumbency outside general election -> byElection
        events.push({ date: s.start, type: 'byElection', memberId: s.memberId, constituencyId: cid });
      }
      const next = spells[i + 1];
      if (s.end && next && s.end < next.start) {
        events.push({ date: s.end, type: 'vacancyStart', constituencyId: cid });
        events.push({ date: next.start, type: 'vacancyEnd', constituencyId: cid });
      }
    }
  }

  // 3. Party switches
  const partyGroups = new Map<number, PartySpell[]>();
  for (const ps of normalized.partySpells) {
    if (!partyGroups.has(ps.memberId)) partyGroups.set(ps.memberId, []);
    partyGroups.get(ps.memberId)!.push(ps);
  }
  for (const [mid, spells] of Array.from(partyGroups.entries())) {
    spells.sort(byStart);
    for (let i = 1; i < spells.length; i++) {
      const prev = spells[i - 1];
      const curr = spells[i];
      if (curr.partyId !== prev.partyId) {
        if (!generalElectionSet.has(curr.start) && curr.start >= cfg.since) {
          events.push({ date: curr.start, type: 'partySwitch', memberId: mid, fromPartyId: prev.partyId, toPartyId: curr.partyId });
        }
      }
    }
  }

  // Deduplicate (date + type + memberId + constituencyId + fromPartyId + toPartyId)
  const seen = new Set<string>();
  const dedup: Event[] = [];
  for (const ev of events) {
    const key = [ev.date, ev.type, ev.memberId || '', ev.constituencyId || '', ev.fromPartyId || '', ev.toPartyId || ''].join('|');
    if (!seen.has(key)) { seen.add(key); dedup.push(ev); }
  }

  const typeOrder: Record<Event['type'], number> = {
    generalElection: 0,
    vacancyEnd: 1,
    byElection: 2,
    partySwitch: 3,
    seatChange: 4,
    vacancyStart: 5,
  };

  dedup.sort((a,b) => a.date === b.date ? (typeOrder[a.type] - typeOrder[b.type]) : (a.date < b.date ? -1 : 1));
  return dedup;
}
