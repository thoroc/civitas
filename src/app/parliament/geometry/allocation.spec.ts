import { initAllocationContext, allocateMembersToRings } from './allocation';
import { PartyGroup } from './parties';

// Helper to create a minimal Member object conforming to expected shape
const makeMember = (id: string, partyId?: string) => ({
  id,
  label: id,
  constituency: null,
  party: partyId ? { id: partyId, label: partyId, color: '#000000' } : null,
  gender: null,
  age: null,
});

describe('Allocation', () => {
  it('handles empty party groups', () => {
    const partyGroups: PartyGroup[] = [];
    const ctx = initAllocationContext(partyGroups);
    const assigned = allocateMembersToRings({
      seatsPerRing: [0, 5],
      numberOfRings: 1,
      ctx,
    });
    expect(assigned).toHaveLength(1);
    expect(assigned[0]).toHaveLength(0);
  });

  it('allocates when one party has more members than seats', () => {
    const members = [
      makeMember('m1', 'A'),
      makeMember('m2', 'A'),
      makeMember('m3', 'A'),
    ];
    const partyGroups: PartyGroup[] = [
      { id: 'A', label: 'A', members, leaning: 'center' },
    ];
    const ctx = initAllocationContext(partyGroups);
    const assigned = allocateMembersToRings({
      seatsPerRing: [0, 2],
      numberOfRings: 1,
      ctx,
    });
    expect(assigned).toHaveLength(1);
    expect(assigned[0]).toHaveLength(2);
    // remaining members should remain in ctx
    expect(ctx.remainingTotal).toBe(1);
  });

  it('distributes seats proportionally across multiple parties', () => {
    const a = [
      makeMember('a1', 'A'),
      makeMember('a2', 'A'),
      makeMember('a3', 'A'),
    ];
    const b = [makeMember('b1', 'B'), makeMember('b2', 'B')];
    const c = [makeMember('c1', 'C')];
    const partyGroups: PartyGroup[] = [
      { id: 'A', label: 'A', members: a, leaning: 'left' },
      { id: 'B', label: 'B', members: b, leaning: 'center' },
      { id: 'C', label: 'C', members: c, leaning: 'right' },
    ];
    const ctx = initAllocationContext(partyGroups);
    const assigned = allocateMembersToRings({
      seatsPerRing: [0, 3],
      numberOfRings: 1,
      ctx,
    });
    // total seats 3 should be split roughly according to proportions
    expect(assigned[0].length).toBe(3);
    const ids = assigned[0].map((m: any) => m.id);
    expect(ids).toContain('a1');
  });

  it('fills remaining seats in party order when remainders exhausted', () => {
    const a = [makeMember('a1', 'A')];
    const b = [makeMember('b1', 'B')];
    const partyGroups: PartyGroup[] = [
      { id: 'A', label: 'A', members: a, leaning: 'left' },
      { id: 'B', label: 'B', members: b, leaning: 'right' },
    ];
    const ctx = initAllocationContext(partyGroups);
    const assigned = allocateMembersToRings({
      seatsPerRing: [0, 3],
      numberOfRings: 1,
      ctx,
    });
    // there are 2 members but 3 seats; fillRemainingSeats should stop at available members
    expect(assigned[0].length).toBe(2);
    expect(ctx.remainingTotal).toBe(0);
  });

  // New tests below
  it('allocates across multiple rings sequentially', () => {
    const a = [makeMember('a1', 'A'), makeMember('a2', 'A')];
    const b = [makeMember('b1', 'B')];
    const partyGroups: PartyGroup[] = [
      { id: 'A', label: 'A', members: a, leaning: 'left' },
      { id: 'B', label: 'B', members: b, leaning: 'right' },
    ];
    const ctx = initAllocationContext(partyGroups);
    // ring1: 2 seats, ring2: 1 seat
    const assigned = allocateMembersToRings({
      seatsPerRing: [0, 2, 1],
      numberOfRings: 2,
      ctx,
    });
    expect(assigned).toHaveLength(2);
    expect(assigned[0].length + assigned[1].length).toBe(3);
    // ensure each member assigned once
    const ids = assigned.flat().map((m: any) => m.id);
    expect(ids).toEqual(expect.arrayContaining(['a1', 'a2', 'b1']));
    expect(ctx.remainingTotal).toBe(0);
  });

  it('returns empty arrays when seats per ring are zero', () => {
    const a = [makeMember('a1', 'A')];
    const partyGroups: PartyGroup[] = [
      { id: 'A', label: 'A', members: a, leaning: 'left' },
    ];
    const ctx = initAllocationContext(partyGroups);
    const assigned = allocateMembersToRings({
      seatsPerRing: [0, 0],
      numberOfRings: 1,
      ctx,
    });
    expect(assigned).toHaveLength(1);
    expect(assigned[0]).toHaveLength(0);
    // member should remain unassigned
    expect(ctx.remainingTotal).toBe(1);
  });

  it('handles large party overflow across multiple rings', () => {
    // Party A has many members but few seats total across rings
    const members = Array.from({ length: 10 }, (_, i) =>
      makeMember(`m${i + 1}`, 'A')
    );
    const partyGroups: PartyGroup[] = [
      { id: 'A', label: 'A', members, leaning: 'center' },
    ];
    const ctx = initAllocationContext(partyGroups);
    // only 4 seats across two rings
    const assigned = allocateMembersToRings({
      seatsPerRing: [0, 2, 2],
      numberOfRings: 2,
      ctx,
    });
    expect(assigned).toHaveLength(2);
    expect(assigned[0].length + assigned[1].length).toBe(4);
    // ensure remainingTotal equals 6
    expect(ctx.remainingTotal).toBe(6);
  });
});
