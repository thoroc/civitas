import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { Member } from '../types';

import { useHemicycleLayout } from './use-hemicycle-layout';

describe('useHemicycleLayout integration (compose behavior)', () => {
  it('returns seats mapped to members with active flags and viewbox sizes', () => {
    let result: any = null;

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
      makeMember('m6', 'p2', 'Conservative'),
      makeMember('m7', 'p4', 'Sinn Fein'),
    ];

    const filteredIds = new Set<string>(['m2', 'm5']);
    const partyMeta = { p2: { leaning: 'right' } } as Record<
      string,
      { leaning: any }
    >;

    function Fixture() {
      // call the hook; useMemo inside the hook will run during render
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const layout = useHemicycleLayout({ members, filteredIds, partyMeta });
      result = layout;
      return React.createElement('div', null, 'ok');
    }

    // Server-render the component to synchronously run the hook
    renderToString(React.createElement(Fixture));

    expect(result).not.toBeNull();
    // seats length matches members
    expect(result.seats.length).toBe(members.length);

    // each seat has member and active flag set appropriately
    for (const seat of result.seats) {
      expect(seat.member).toBeDefined();
      expect(seat.x).toBeDefined();
      expect(seat.y).toBeDefined();
      // active should be boolean and true iff member id in filteredIds
      expect(typeof seat.active).toBe('boolean');
      const shouldBeActive = filteredIds.has(seat.member.id);
      expect(seat.active).toBe(shouldBeActive);
    }

    // viewbox sizes
    expect(result.vbWidth).toBeGreaterThan(0);
    expect(result.vbHeight).toBeGreaterThan(0);
    expect(result.r0).toBeGreaterThan(0);
    expect(result.pad).toBeDefined();
    expect(Array.isArray(result.ringMeta)).toBe(true);
  });
});
