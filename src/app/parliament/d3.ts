type Radius = number;
type Distance = number;
type Score = number;
type NumberOfElements = number;
type Size = number;

// Consolidated geometry config for repeated parameter groups
export interface GeometryConfig {
  size: Size; // total number of seats/items
  radius: Radius; // base radius (r0)
}

export interface GeometryConfigWithN extends GeometryConfig {
  n: number; // number of rings
}

export type Ring = Item[];
export type Item = {
  x: number;
  y: number;
  a?: Distance;
  label?: string;
  rgb?: string;
};

interface CountResult {
  count?: { value?: string };
  [k: string]: unknown;
}
export const getTotal = (resultsList: CountResult[]): number => {
  let total = 0;
  for (const item of resultsList) {
    if (item?.count?.value !== undefined) {
      const v = parseInt(item.count.value);
      if (!Number.isNaN(v)) total += v;
    }
  }
  return total;
};

export const getCoordinates = (radius: Radius, b: number): Item => {
  const x = parseFloat((radius * Math.cos(b / radius - Math.PI)).toFixed(10));
  const y = parseFloat((radius * Math.sin(b / radius - Math.PI)).toFixed(10));

  return { x, y };
};

interface FindAOptions {
  size: Size;
  n: number;
  radius: Radius;
}

export const findA = ({ size, n, radius }: FindAOptions): Distance => {
  const x = (Math.PI * n * radius) / (size - n);
  const y = 1 + (Math.PI * (n - 1) * n) / 2 / (size - n);
  return x / y;
};

export const findAWithConfig = (cfg: GeometryConfigWithN): Distance =>
  findA({ size: cfg.size, n: cfg.n, radius: cfg.radius });

interface GetScoreOptions {
  size: Size;
  n: number;
  radius: Radius;
}

export const getScore = ({ size, n, radius }: GetScoreOptions): Score => {
  return Math.abs((findA({ size, n, radius }) * n) / radius - 5 / 7);
};

export const getScoreWithConfig = (cfg: GeometryConfigWithN): Score =>
  getScore({ size: cfg.size, n: cfg.n, radius: cfg.radius });

export const findN = (size: Size, radius: Radius): NumberOfElements => {
  let n = Math.floor(Math.log(size) / Math.log(2)) || 1;
  let distance: Score = getScore({ size, n, radius });
  let direction: number = 0;

  if (getScore({ size, n: n + 1, radius }) < distance) {
    direction = 1;
  }

  if (getScore({ size, n: n - 1, radius }) < distance && n > 1) {
    direction = -1;
  }

  while (getScore({ size, n: n + direction, radius }) < distance && n > 0) {
    distance = getScore({ size, n: n + direction, radius });
    n += direction;
  }

  return n;
};

export const findNFromConfig = (cfg: GeometryConfig): NumberOfElements =>
  findN(cfg.size, cfg.radius);

export const nextRing = (rings: Ring[], ringProgress: number[]): number => {
  let result: number = 0;
  let progressQuota: number = 0;
  let tQuota: number = 0;

  for (const i in rings) {
    tQuota = parseFloat(((ringProgress[i] || 0) / rings[i].length).toFixed(10));

    if (!progressQuota || tQuota < progressQuota) {
      progressQuota = tQuota;
    }
  }

  for (const j in rings) {
    tQuota = parseFloat(((ringProgress[j] || 0) / rings[j].length).toFixed(10));

    if (tQuota == progressQuota) {
      result = parseInt(j);
    }
  }

  return result;
};

export const distribute = (votes: number[], seats: number): number[] => {
  // initial settings for divisor finding
  let voteSum = 0;

  for (const party in votes) {
    voteSum += votes[party];
  }

  let low = voteSum / (seats - 2);
  let high = voteSum / (seats + 2);
  let divisor = voteSum / seats;

  let parliament = calculateSeats(votes, divisor);

  // find divisor
  while (parliament.seats != seats) {
    if (parliament.seats < seats) low = divisor;
    if (parliament.seats > seats) high = divisor;
    divisor = (low + high) / 2;
    parliament = calculateSeats(votes, divisor);
  }

  return parliament.distribution;
};

interface SeatsDistribution {
  distribution: number[];
  seats: number;
}

const calculateSeats = (
  votes: number[],
  divisor: number
): SeatsDistribution => {
  const distribution: number[] = [];
  let seats = 0;
  for (const party in votes) {
    distribution[party] = Math.round(votes[party] / divisor);
    seats += distribution[party];
  }
  return { distribution, seats };
};

interface PopulateRingsOptions {
  seatsPerRing: number[];
  numberOfRings: number;
  r0: Radius;
  a0: number;
}

export const populateRings = ({
  seatsPerRing,
  numberOfRings,
  r0,
  a0,
}: PopulateRingsOptions): Ring[] => {
  let radius: number;
  const points: Ring[] = [];

  // build seats
  // loop rings
  for (let j = 1; j <= numberOfRings; j++) {
    const ring = [];
    // calculate ring-specific radius
    radius = r0 - (j - 1) * a0;
    // calculate ring-specific distance
    const a = (Math.PI * radius) / (seatsPerRing[j] - 1 || 1);

    // loop points
    for (let k = 0; k <= seatsPerRing[j] - 1; k++) {
      const point: Item = getCoordinates(radius, k * a);
      point.a = 0.4 * a0;
      ring.push(point);
    }
    points.push(ring);
  }

  return points;
};

export const merge = (arrays: Ring[]): number[][] => {
  const result: number[][] = [];
  for (const list of arrays) {
    for (const item of list) {
      result.push([item.x, item.y]);
    }
  }
  return result;
};
