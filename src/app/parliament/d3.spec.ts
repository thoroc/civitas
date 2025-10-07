import { describe, it, expect } from 'vitest';

import {
  getCoordinates,
  findA,
  findN,
  populateRings,
  distribute,
  merge,
} from './d3';

describe('d3 utilities', () => {
  it('getCoordinates returns numeric x/y for given radius and b', () => {
    const coord = getCoordinates(80, 1.2);
    expect(typeof coord.x).toBe('number');
    expect(typeof coord.y).toBe('number');
  });

  it('findA produces a positive distance for reasonable inputs', () => {
    const a = findA({ size: 100, n: 3, radius: 80 });
    expect(a).toBeGreaterThan(0);
  });

  it('findN returns at least 1 for moderate sizes', () => {
    const n = findN(100, 80);
    expect(n).toBeGreaterThanOrEqual(1);
  });

  it('populateRings returns correct ring count and each ring length matches seatsPerRing', () => {
    const seatsPerRing = [] as number[];
    seatsPerRing[1] = 10;
    seatsPerRing[2] = 8;
    const rings = populateRings({
      seatsPerRing,
      numberOfRings: 2,
      r0: 80,
      a0: 10,
    });
    expect(rings.length).toBe(2);
    expect(rings[0].length).toBe(10);
    expect(rings[1].length).toBe(8);
  });

  it('distribute splits seats proportionally', () => {
    const votes = [100, 100, 200];
    const seats = 10;
    const distro = distribute(votes, seats);
    expect(distro.reduce((a, b) => a + b, 0)).toBe(seats);
  });

  it('merge flattens rings into coordinate pairs', () => {
    const seatsPerRing = [] as number[];
    seatsPerRing[1] = 2;
    const rings = populateRings({
      seatsPerRing,
      numberOfRings: 1,
      r0: 10,
      a0: 5,
    });
    const merged = merge(rings);
    expect(Array.isArray(merged)).toBe(true);
    expect(merged[0].length).toBe(2);
  });
});
