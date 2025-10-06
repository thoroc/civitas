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

interface GeometryResult {
  ringMeta: { start: number; end: number; size: number }[];
  flatSeats: Item[];
  r0: number;
  seatsPerRing: number[];
  numberOfRings: number;
}

const BASE_RADIUS = 80;
const PADDING = 10;

// 1. Geometry (ring radii + seat coords)
const computeHemicycleGeometry = (totalSeats: number): GeometryResult => {
  const r0 = BASE_RADIUS;
  const numberOfRings = findN(totalSeats, r0);
  const a0 = findA({ size: totalSeats, n: numberOfRings, radius: r0 });
  const ringRadiis: number[] = [];
  for (let i = 1; i <= numberOfRings; i++) ringRadiis[i] = r0 - (i - 1) * a0;
  const seatsPerRing = distribute(ringRadiis, totalSeats);
  const rings = populateRings({ seatsPerRing, numberOfRings, r0, a0 });
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
  return { ringMeta, flatSeats, r0, seatsPerRing, numberOfRings };
};

// 2. Party grouping + classification
export type Leaning = 'left' | 'center' | 'right';
const LEANING_ORDER: Leaning[] = ['left', 'center', 'right'];

const classifyLeaning = (
  m: Member,
  partyMeta: Record<string, { leaning: Leaning }>
): Leaning => {
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

const groupAndSortParties = (
  members: Member[],
  partyMeta: Record<string, { leaning: Leaning }>
): PartyGroup[] => {
  const map = new Map<string, PartyGroup>();
  for (const m of members) {
    const partyId = m.party?.id || '__independent';
    let pg = map.get(partyId);
    if (!pg) {
      pg = {
        id: partyId,
        label: m.party?.label || 'Independent',
        members: [],
        leaning: classifyLeaning(m, partyMeta),
        color: m.party?.color,
      };
      map.set(partyId, pg);
    }
    pg.members.push(m);
  }
  const groups = Array.from(map.values());
  groups.sort((a, b) => {
    const leanDiff =
      LEANING_ORDER.indexOf(a.leaning) - LEANING_ORDER.indexOf(b.leaning);
    if (leanDiff) return leanDiff;
    const sizeDiff = b.members.length - a.members.length;
    if (sizeDiff) return sizeDiff;
    return a.label.localeCompare(b.label);
  });
  return groups;
};

// 3. Allocation across rings
interface AllocationContext {
  partyGroups: PartyGroup[];
  partyOrderIndex: Record<string, number>;
  remainingPerParty: Record<string, number>;
  remainingTotal: number;
  nextIndexPerParty: Record<string, number>;
}

const initAllocationContext = (
  partyGroups: PartyGroup[]
): AllocationContext => {
  const partyOrderIndex: Record<string, number> = {};
  partyGroups.forEach((pg, idx) => (partyOrderIndex[pg.id] = idx));
  const remainingPerParty: Record<string, number> = {};
  partyGroups.forEach(pg => (remainingPerParty[pg.id] = pg.members.length));
  const nextIndexPerParty: Record<string, number> = {};
  partyGroups.forEach(pg => (nextIndexPerParty[pg.id] = 0));
  const remainingTotal = partyGroups.reduce(
    (acc, g) => acc + g.members.length,
    0
  );
  return {
    partyGroups,
    partyOrderIndex,
    remainingPerParty,
    remainingTotal,
    nextIndexPerParty,
  };
};

interface AllocateMembersOptions {
  seatsPerRing: number[];
  numberOfRings: number;
  ctx: AllocationContext;
}

interface PartyAllocation {
  partyId: string;
  base: number;
  remainder: number;
}

const buildBaseAllocations = (
  ctx: AllocationContext,
  ringSeatCount: number
): { allocations: PartyAllocation[]; baseSum: number } => {
  const allocations: PartyAllocation[] = [];
  let baseSum = 0;
  for (const pg of ctx.partyGroups) {
    const remaining = ctx.remainingPerParty[pg.id];
    if (remaining <= 0 || ctx.remainingTotal === 0) {
      allocations.push({ partyId: pg.id, base: 0, remainder: 0 });
      continue;
    }
    const quota = (remaining / ctx.remainingTotal) * ringSeatCount;
    const base = Math.floor(quota);
    const remainder = quota - base;
    allocations.push({ partyId: pg.id, base, remainder });
    baseSum += base;
  }
  return { allocations, baseSum };
};

interface DistributeRemaindersOptions {
  allocations: PartyAllocation[];
  leftover: number;
  ctx: AllocationContext;
}

const distributeRemainders = ({
  allocations,
  leftover,
  ctx,
}: DistributeRemaindersOptions) => {
  allocations.sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < allocations.length && leftover > 0; i++) {
    if (ctx.remainingPerParty[allocations[i].partyId] > 0) {
      allocations[i].base += 1;
      leftover--;
    }
  }
  return leftover;
};

const assignFromAllocations = (
  allocations: PartyAllocation[],
  ctx: AllocationContext
): Member[] => {
  allocations.sort(
    (a, b) => ctx.partyOrderIndex[a.partyId] - ctx.partyOrderIndex[b.partyId]
  );
  const ringAssigned: Member[] = [];
  for (const alloc of allocations) {
    const take = Math.min(alloc.base, ctx.remainingPerParty[alloc.partyId]);
    if (take <= 0) continue;
    const pg = ctx.partyGroups[ctx.partyOrderIndex[alloc.partyId]];
    const start = ctx.nextIndexPerParty[alloc.partyId];
    const end = start + take;
    ringAssigned.push(...pg.members.slice(start, end));
    ctx.nextIndexPerParty[alloc.partyId] = end;
    ctx.remainingPerParty[alloc.partyId] -= take;
    ctx.remainingTotal -= take;
  }
  return ringAssigned;
};

interface FillRemainingSeatsOptions {
  ringAssigned: Member[];
  ringSeatCount: number;
  ctx: AllocationContext;
}

const fillRemainingSeats = ({
  ringAssigned,
  ringSeatCount,
  ctx,
}: FillRemainingSeatsOptions) => {
  if (ringAssigned.length >= ringSeatCount) return;
  for (const pg of ctx.partyGroups) {
    while (
      ringAssigned.length < ringSeatCount &&
      ctx.remainingPerParty[pg.id] > 0
    ) {
      const idx = ctx.nextIndexPerParty[pg.id];
      ringAssigned.push(pg.members[idx]);
      ctx.nextIndexPerParty[pg.id] = idx + 1;
      ctx.remainingPerParty[pg.id] -= 1;
      ctx.remainingTotal -= 1;
    }
    if (ringAssigned.length === ringSeatCount) break;
  }
};

const allocateMembersToRings = ({
  seatsPerRing,
  numberOfRings,
  ctx,
}: AllocateMembersOptions): Member[][] => {
  const assigned: Member[][] = [];
  for (let ringIdx = 1; ringIdx <= numberOfRings; ringIdx++) {
    const ringSeatCount = seatsPerRing[ringIdx];
    const { allocations, baseSum } = buildBaseAllocations(ctx, ringSeatCount);
    const leftover = ringSeatCount - baseSum;
    distributeRemainders({ allocations, leftover, ctx });
    const ringAssigned = assignFromAllocations(allocations, ctx);
    fillRemainingSeats({ ringAssigned, ringSeatCount, ctx });
    assigned.push(ringAssigned);
  }
  return assigned;
};

// 4. Mapping seats + final dimensions
interface MapSeatsOptions {
  flatSeats: Item[];
  orderedMembers: Member[];
  r0: number;
  filteredIds: Set<string>;
}

const mapSeats = ({
  flatSeats,
  orderedMembers,
  r0,
  filteredIds,
}: MapSeatsOptions): Array<Item & { member: Member; active: boolean }> =>
  flatSeats.map((seat, idx) => ({
    ...seat,
    x: seat.x + r0,
    y: seat.y + r0,
    member: orderedMembers[idx]!,
    active: filteredIds.has(orderedMembers[idx]!.id),
  }));

// Public hook (now orchestration only)
export const useHemicycleLayout = ({
  members,
  filteredIds,
  partyMeta,
}: Options): HemicycleLayoutResult => {
  return useMemo(() => {
    const totalSeats = members.length;

    const { ringMeta, flatSeats, r0, seatsPerRing, numberOfRings } =
      computeHemicycleGeometry(totalSeats);

    const partyGroups = groupAndSortParties(members, partyMeta);
    const allocationCtx = initAllocationContext(partyGroups);
    const assignedByRing = allocateMembersToRings({
      seatsPerRing,
      numberOfRings,
      ctx: allocationCtx,
    });
    let orderedMembers: Member[] = assignedByRing.flat();
    if (orderedMembers.length !== members.length)
      orderedMembers = members.slice();

    const seats = mapSeats({
      flatSeats,
      orderedMembers,
      r0,
      filteredIds,
    });

    const vbWidth = r0 * 2 + PADDING * 2;
    const vbHeight = r0 + PADDING * 2;

    return { seats, pad: PADDING, vbWidth, vbHeight, ringMeta, r0 };
  }, [members, filteredIds, partyMeta]);
};

export default useHemicycleLayout;
