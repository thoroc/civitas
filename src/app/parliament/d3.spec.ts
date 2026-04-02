import { describe, expect, it } from 'vitest';

import {
  distribute,
  findA,
  findAWithConfig,
  findN,
  findNFromConfig,
  getCoordinates,
  getScore,
  getScoreWithConfig,
  getTotal,
  merge,
  nextRing,
  populateRings,
} from './d3';

describe('parliament d3 utilities', () => {
  it('getTotal sums valid count values and ignores invalid', () => {
    const input = [
      { count: { value: '10' } },
      { count: { value: '5' } },
      {},
      { count: { value: 'x' } },
      { other: 1 },
    ];
    expect(getTotal(input)).toBe(15);
  });

  it('getCoordinates returns predictable points (b=0 -> leftmost)', () => {
    const p = getCoordinates(1, 0);
    expect(p.x).toBeCloseTo(-1, 10);
    expect(p.y).toBeCloseTo(0, 10);
  });

  it('findA and findAWithConfig agree and follow formula', () => {
    const size = 10;
    const n = 2;
    const radius = 5;
    const expected =
      (Math.PI * n * radius) /
      (size - n) /
      (1 + (Math.PI * (n - 1) * n) / 2 / (size - n));
    expect(findA({ size, n, radius })).toBeCloseTo(expected, 12);
    expect(findAWithConfig({ size, n, radius })).toBeCloseTo(expected, 12);
  });

  it('getScore and getScoreWithConfig agree', () => {
    const size = 20;
    const n = 3;
    const radius = 8;
    const s1 = getScore({ size, n, radius });
    const s2 = getScoreWithConfig({ size, n, radius });
    expect(s1).toBeCloseTo(s2, 12);
    // score is absolute, should be non-negative
    expect(s1).toBeGreaterThanOrEqual(0);
  });

  it('findN and findNFromConfig produce an integer >= 1', () => {
    const size = 100;
    const radius = 5;
    const nExplicit = findN(size, radius);
    const nCfg = findNFromConfig({ size, radius });
    expect(Number.isInteger(nExplicit)).toBe(true);
    expect(nExplicit).toBeGreaterThanOrEqual(1);
    expect(nCfg).toBe(nExplicit);
  });

  it('nextRing selects the last ring with minimal progress quota', () => {
    const rings = [[1, 2, 3], [1, 2], [1]] as any;
    // progress quotas: [0/3=0, 0.5, 0] => minimal quota = 0, last matching index = 2
    const ringProgress = [0, 1, 0];
    expect(nextRing(rings, ringProgress)).toBe(2);

    // all zero progress -> last index
    expect(nextRing(rings, [0, 0, 0])).toBe(2);
  });

  it('distribute returns symmetric results for equal votes', () => {
    const votes = [100, 100, 100];
    const seats = 3;
    const dist = distribute(votes, seats);
    expect(dist).toEqual([1, 1, 1]);

    // equal votes but more seats -> proportional rounding
    const votes2 = [100, 100];
    const seats2 = 4;
    const dist2 = distribute(votes2, seats2);
    // should split seats roughly equally
    expect(dist2.reduce((a, b) => a + b, 0)).toBe(4);
    expect(Math.abs(dist2[0] - dist2[1])).toBeLessThanOrEqual(1);
  });

  it('populateRings produces rings with expected counts and values', () => {
    const seatsPerRing = [0, 5, 3]; // 1-indexed in implementation
    const numberOfRings = 2;
    const r0 = 10;
    const a0 = 1;
    const rings = populateRings({ seatsPerRing, numberOfRings, r0, a0 });
    expect(rings.length).toBe(2);
    expect(rings[0].length).toBe(5);
    expect(rings[1].length).toBe(3);
    // each item should have a and numeric x,y
    for (const ring of rings) {
      for (const item of ring) {
        expect(typeof item.x).toBe('number');
        expect(typeof item.y).toBe('number');
        expect(item.a).toBeCloseTo(0.4 * a0, 12);
      }
    }
  });

  it('merge flattens rings into [x,y] pairs', () => {
    const ringA = [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ];
    const ringB = [{ x: -1, y: -2 }];
    const merged = merge([ringA as any, ringB as any]);
    expect(merged).toEqual([
      [1, 2],
      [3, 4],
      [-1, -2],
    ]);
  });
});
