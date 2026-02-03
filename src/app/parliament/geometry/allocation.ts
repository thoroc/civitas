import { Member } from '../types';

import { PartyGroup } from './parties';

export interface AllocationContext {
  partyGroups: PartyGroup[];
  partyOrderIndex: Record<string, number>;
  remainingPerParty: Record<string, number>;
  remainingTotal: number;
  nextIndexPerParty: Record<string, number>;
}

export const initAllocationContext = (
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

export const allocateMembersToRings = ({
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
