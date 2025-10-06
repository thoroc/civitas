import { useMemo } from 'react';

import { findA, findN, distribute, populateRings, Item } from '../d3';
import { Member } from '../types';

export interface HemicycleLayoutResult {
  seats: Array<Item & { member: Member; active: boolean }>;
  pad: number;
  vbWidth: number;
  vbHeight: number;
  ringMeta: { start: number; end: number; size: number }[];
  r0: number;
}

interface Options {
  members: Member[];
  filteredIds: Set<string>;
  partyMeta: Record<string, { leaning: 'left' | 'center' | 'right' }>;
}

// Extracted from HemicycleReact to reduce size/complexity
export const useHemicycleLayout = ({
  members,
  filteredIds,
  partyMeta,
}: Options): HemicycleLayoutResult => {
  return useMemo(() => {
    const r0 = 80;
    const totalSeats = members.length;
    const numberOfRings = findN(totalSeats, r0);
    const a0 = findA(totalSeats, numberOfRings, r0);
    const ringRadiis: number[] = [];
    for (let i = 1; i <= numberOfRings; i++) {
      ringRadiis[i] = r0 - (i - 1) * a0;
    }
    const seatsPerRing = distribute(ringRadiis, totalSeats);
    const rings = populateRings(seatsPerRing, numberOfRings, r0, a0);
    const ringMeta: { start: number; end: number; size: number }[] = [];
    const flatSeats: Item[] = [];
    let cursor = 0;
    rings.forEach(r => {
      const start = cursor;
      r.forEach(pt => {
        flatSeats.push(pt);
        cursor++;
      });
      const end = cursor - 1;
      ringMeta.push({ start, end, size: end - start + 1 });
    });

    type Leaning = 'left' | 'center' | 'right';
    const LEANING_ORDER: Leaning[] = ['left', 'center', 'right'];

    const classifyMember = (m: Member): Leaning => {
      const pid = m.party?.id;
      if (pid && partyMeta[pid]?.leaning) return partyMeta[pid].leaning;
      const label = m.party?.label?.toLowerCase() || '';
      if (/green|labour|social|democrat|sinn|plaid|sdlp|alliance/.test(label))
        return 'left';
      if (/conservative|unionist|reform|libertarian|ukip/.test(label))
        return 'right';
      if (/liberal/.test(label)) return 'center';
      return 'center';
    };

    interface PartyGroup {
      id: string;
      label: string;
      members: Member[];
      leaning: Leaning;
      color?: string;
    }
    const partyGroupsMap = new Map<string, PartyGroup>();

    for (const m of members) {
      const partyId = m.party?.id || '__independent';
      let pg = partyGroupsMap.get(partyId);
      if (!pg) {
        pg = {
          id: partyId,
          label: m.party?.label || 'Independent',
          members: [],
          leaning: classifyMember(m),
          color: m.party?.color,
        };
        partyGroupsMap.set(partyId, pg);
      }
      pg.members.push(m);
    }

    const partyGroups = Array.from(partyGroupsMap.values());
    partyGroups.sort((a, b) => {
      const leanDiff =
        LEANING_ORDER.indexOf(a.leaning) - LEANING_ORDER.indexOf(b.leaning);
      if (leanDiff !== 0) return leanDiff;
      const sizeDiff = b.members.length - a.members.length;
      if (sizeDiff !== 0) return sizeDiff;
      return a.label.localeCompare(b.label);
    });

    const partyOrderIndex: Record<string, number> = {};
    partyGroups.forEach((pg, idx) => {
      partyOrderIndex[pg.id] = idx;
    });

    const remainingPerParty: Record<string, number> = {};
    partyGroups.forEach(pg => {
      remainingPerParty[pg.id] = pg.members.length;
    });
    let remainingTotal = totalSeats;

    const nextIndexPerParty: Record<string, number> = {};
    partyGroups.forEach(pg => {
      nextIndexPerParty[pg.id] = 0;
    });

    const assignedMembersByRing: Member[][] = [];

    for (let ringIdx = 1; ringIdx <= numberOfRings; ringIdx++) {
      const ringSeatCount = seatsPerRing[ringIdx];
      const allocations: {
        partyId: string;
        base: number;
        remainder: number;
      }[] = [];
      let baseSum = 0;

      for (const pg of partyGroups) {
        const remaining = remainingPerParty[pg.id];
        if (remaining <= 0 || remainingTotal === 0) {
          allocations.push({ partyId: pg.id, base: 0, remainder: 0 });
          continue;
        }
        const quota = (remaining / remainingTotal) * ringSeatCount;
        const base = Math.floor(quota);
        const remainder = quota - base;
        allocations.push({ partyId: pg.id, base, remainder });
        baseSum += base;
      }

      let leftover = ringSeatCount - baseSum;
      allocations.sort((a, b) => b.remainder - a.remainder);
      for (let i = 0; i < allocations.length && leftover > 0; i++) {
        if (remainingPerParty[allocations[i].partyId] > 0) {
          allocations[i].base += 1;
          leftover--;
        }
      }
      allocations.sort(
        (a, b) => partyOrderIndex[a.partyId] - partyOrderIndex[b.partyId]
      );

      const ringAssigned: Member[] = [];
      for (const alloc of allocations) {
        const take = Math.min(alloc.base, remainingPerParty[alloc.partyId]);
        if (take <= 0) continue;
        const pg = partyGroups[partyOrderIndex[alloc.partyId]];
        const start = nextIndexPerParty[alloc.partyId];
        const end = start + take;
        const slice = pg.members.slice(start, end);
        ringAssigned.push(...slice);
        nextIndexPerParty[alloc.partyId] = end;
        remainingPerParty[alloc.partyId] -= take;
        remainingTotal -= take;
      }

      if (ringAssigned.length < ringSeatCount) {
        for (const pg of partyGroups) {
          while (
            ringAssigned.length < ringSeatCount &&
            remainingPerParty[pg.id] > 0
          ) {
            const idx = nextIndexPerParty[pg.id];
            ringAssigned.push(pg.members[idx]);
            nextIndexPerParty[pg.id] = idx + 1;
            remainingPerParty[pg.id] -= 1;
            remainingTotal -= 1;
          }
          if (ringAssigned.length === ringSeatCount) break;
        }
      }
      assignedMembersByRing.push(ringAssigned);
    }

    let orderedMembers: Member[] = assignedMembersByRing.flat();
    if (orderedMembers.length !== members.length) {
      orderedMembers = members.slice();
    }

    const mappedSeats = flatSeats.map((seat, idx) => ({
      ...seat,
      x: seat.x + r0,
      y: seat.y + r0,
      member: orderedMembers[idx]!, // assert non-null (layout guarantees length)
      active: filteredIds.has(orderedMembers[idx]!.id),
    }));

    const padLocal = 10;
    const vbWidthLocal = r0 * 2 + padLocal * 2;
    const vbHeightLocal = r0 + padLocal * 2;

    return {
      seats: mappedSeats,
      pad: padLocal,
      vbWidth: vbWidthLocal,
      vbHeight: vbHeightLocal,
      ringMeta,
      r0,
    };
  }, [members, filteredIds, partyMeta]);
};

export default useHemicycleLayout;
