import { describe, expect, it } from 'vitest';

import { buildSeatAria } from './seatAria';

const makeMember = (label: string, partyLabel?: string, color?: string) =>
  ({
    label,
    party: partyLabel
      ? { label: partyLabel, color: color ?? '#000000' }
      : undefined,
  }) as any;

describe('buildSeatAria', () => {
  it('produces correct label for active seat with party', () => {
    const result = buildSeatAria({
      seatIndex: 0,
      seat: { member: makeMember('Alice', 'Green'), active: true },
      inactive: false,
    });
    expect(result.ariaLabel).toBe('Seat 1: Alice, Green');
    expect(result.titleText).toBe('Alice – Green');
  });

  it('produces correct label for active seat without party', () => {
    const result = buildSeatAria({
      seatIndex: 4,
      seat: { member: makeMember('Bob') },
      inactive: false,
    });
    expect(result.ariaLabel).toBe('Seat 5: Bob');
    expect(result.titleText).toBe('Bob');
  });

  it('appends filtered-out suffix when inactive', () => {
    const result = buildSeatAria({
      seatIndex: 2,
      seat: { member: makeMember('Carol', 'Liberal') },
      inactive: true,
    });
    expect(result.ariaLabel).toContain('(filtered out)');
    expect(result.titleText).toContain('(filtered out)');
  });

  it('uses Unknown for seat with no member', () => {
    const result = buildSeatAria({
      seatIndex: 0,
      seat: {},
      inactive: false,
    });
    expect(result.ariaLabel).toContain('Unknown');
  });

  it('uses 1-based seat index', () => {
    const result = buildSeatAria({
      seatIndex: 9,
      seat: { member: makeMember('Dave') },
      inactive: false,
    });
    expect(result.ariaLabel).toMatch(/^Seat 10:/);
  });
});
