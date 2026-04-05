import type { EventTypeLookup } from '../eventType.ts';
import { classifyEventType } from '../eventType.ts';
import type { NormalizedData, Snapshot, SnapshotMember } from '../schemas.ts';
import type { ActiveState, SnapshotSourceHashes } from './types.ts';

export const buildSnapshot = (params: {
  date: string;
  normalized: NormalizedData;
  state: Map<number, ActiveState>;
  sourceHashes: SnapshotSourceHashes;
  eventTypeLookup?: EventTypeLookup;
}): Snapshot => {
  const { date, normalized, state, sourceHashes, eventTypeLookup } = params;
  const members: SnapshotMember[] = [];

  for (const [memberId, active] of Array.from(state.entries())) {
    const partySpell = normalized.partySpells.find(
      p =>
        p.memberId === memberId && p.start <= date && (!p.end || p.end >= date)
    );
    const seatSpell = normalized.seatSpells.find(
      s =>
        s.memberId === memberId && s.start <= date && (!s.end || s.end >= date)
    );

    members.push({
      memberId,
      name:
        normalized.members.find(m => m.memberId === memberId)?.name ||
        String(memberId),
      constituencyId: active.constituency,
      constituencyName: active.constituencyName,
      partyId: active.party,
      partyName: active.partyName,
      provisional: !!(partySpell?.provisional || seatSpell?.provisional),
    });
  }

  members.sort((a, b) => a.memberId - b.memberId);

  const parties: Record<string, number> = {};
  for (const member of members) {
    parties[member.partyId] = (parties[member.partyId] || 0) + 1;
  }

  return {
    date,
    eventType: classifyEventType(date, eventTypeLookup),
    meta: {
      generatedAt: new Date().toISOString(),
      source: sourceHashes,
    },
    members,
    parties,
    total: members.length,
  };
};
