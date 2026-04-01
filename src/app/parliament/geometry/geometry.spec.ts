import { describe, it, expect } from 'vitest';

import { computeHemicycleGeometry } from './geometry';

describe('computeHemicycleGeometry', () => {
  it('computes consistent ring metadata and seat allocation for 16 seats', () => {
    const totalSeats = 16;
    const res = computeHemicycleGeometry(totalSeats);

    // basic invariants
    expect(res.r0).toBe(80);
    expect(res.numberOfRings).toBeGreaterThan(0);

    // seatsPerRing should sum to totalSeats (allowing undefined at index 0)
    const seatsSum = res.seatsPerRing.reduce((acc, v) => acc + (v || 0), 0);
    expect(seatsSum).toBe(totalSeats);

    // flatSeats length should equal totalSeats
    expect(res.flatSeats.length).toBe(totalSeats);

    // ringMeta sizes should match seatsPerRing entries
    const metaSum = res.ringMeta.reduce((acc, m) => acc + m.size, 0);
    expect(metaSum).toBe(totalSeats);

    // ringMeta size entries correspond to seatsPerRing (indices 1..n)
    for (let i = 0; i < res.numberOfRings; i++) {
      const seatsForRing = res.seatsPerRing[i + 1] || 0;
      expect(res.ringMeta[i].size).toBe(seatsForRing);
    }
  });

  it('handles 10 seats', () => {
    const totalSeats = 10;
    const res = computeHemicycleGeometry(totalSeats);
    expect(res.flatSeats.length).toBe(totalSeats);
    const seatsSum = res.seatsPerRing.reduce((acc, v) => acc + (v || 0), 0);
    expect(seatsSum).toBe(totalSeats);
  });
});
