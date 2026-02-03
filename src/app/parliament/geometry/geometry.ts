import {
  findAWithConfig,
  findNFromConfig,
  distribute,
  populateRings,
  Item,
  GeometryConfigWithN,
} from '../d3';

export interface GeometryResult {
  ringMeta: { start: number; end: number; size: number }[];
  flatSeats: Item[];
  r0: number;
  seatsPerRing: number[];
  numberOfRings: number;
}

const BASE_RADIUS = 80;
export const HEMICYCLE_BASE_PADDING = 10;

export const computeHemicycleGeometry = (
  totalSeats: number
): GeometryResult => {
  const r0 = BASE_RADIUS;
  const baseConfig = { size: totalSeats, radius: r0 } as const;
  const numberOfRings = findNFromConfig(baseConfig);
  const a0 = findAWithConfig({
    ...baseConfig,
    n: numberOfRings,
  } as GeometryConfigWithN);
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
