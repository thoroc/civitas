import { describe, expect, it } from 'vitest';

import {
  HEMICYCLE_BASE_PADDING,
  computeHemicycleGeometry,
} from '../geometry/geometry';
import { groupAndSortParties } from '../geometry/parties';
import type { Member } from '../types';

describe('useHemicycleLayout (geometry + parties helpers)', () => {
  it('computeHemicycleGeometry produces consistent ring metadata and seat counts', () => {
    const totalSeats = 10;
    const res = computeHemicycleGeometry(totalSeats);
    // basic sanity
    expect(res.ringMeta.length).toBeGreaterThan(0);
    // flatSeats length equals totalSeats
    expect(res.flatSeats.length).toBe(totalSeats);
    // r0 should be positive
    expect(res.r0).toBeGreaterThan(0);
    // seatsPerRing should sum to totalSeats (array includes undefined index 0)
    const sum = res.seatsPerRing.reduce((s, v) => s + (v || 0), 0);
    expect(sum).toBe(totalSeats);
  });

  it('vbWidth/vbHeight calculation aligns with r0 and padding', () => {
    const totalSeats = 16;
    const res = computeHemicycleGeometry(totalSeats);
    const vbWidth = res.r0 * 2 + HEMICYCLE_BASE_PADDING * 2;
    const vbHeight = res.r0 + HEMICYCLE_BASE_PADDING * 2;
    expect(vbWidth).toBeGreaterThan(vbHeight);
    expect(vbWidth).toBe(res.r0 * 2 + HEMICYCLE_BASE_PADDING * 2);
    expect(vbHeight).toBe(res.r0 + HEMICYCLE_BASE_PADDING * 2);
  });

  it('groupAndSortParties groups members and orders by leaning and size', () => {
    const makeMember = (
      id: string,
      partyId?: string,
      partyLabel?: string
    ): Member =>
      ({
        id,
        name: id,
        party: partyId
          ? { id: partyId, label: partyLabel || partyId }
          : undefined,
      }) as unknown as Member;

    const members: Member[] = [
      makeMember('m1', 'p1', 'Green Party'),
      makeMember('m2', 'p2', 'Conservative'),
      makeMember('m3', 'p1', 'Green Party'),
      makeMember('m4', 'p3', 'Liberal'),
      makeMember('m5', undefined, 'Independent'),
    ];

    const partyMeta = { p2: { leaning: 'right' } } as Record<
      string,
      { leaning: any }
    >;
    const groups = groupAndSortParties(members, partyMeta);
    // groups exist for p1, p2, p3 and __independent
    expect(groups.length).toBeGreaterThanOrEqual(3);
    // left-leaning group (Green) should appear before right by LEANING_ORDER
    const labels = groups.map(g => g.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        'Green Party',
        'Conservative',
        'Liberal',
        'Independent',
      ])
    );
  });
});
