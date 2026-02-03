import { useMemo } from 'react';

import { Item } from '../d3';
import {
  allocateMembersToRings,
  initAllocationContext,
} from '../geometry/allocation';
import {
  computeHemicycleGeometry,
  HEMICYCLE_BASE_PADDING,
} from '../geometry/geometry';
import { groupAndSortParties } from '../geometry/parties';
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

    const seats = mapSeats({ flatSeats, orderedMembers, r0, filteredIds });
    const vbWidth = r0 * 2 + HEMICYCLE_BASE_PADDING * 2;
    const vbHeight = r0 + HEMICYCLE_BASE_PADDING * 2;

    return {
      seats,
      pad: HEMICYCLE_BASE_PADDING,
      vbWidth,
      vbHeight,
      ringMeta,
      r0,
    };
  }, [members, filteredIds, partyMeta]);
};

export default useHemicycleLayout;
