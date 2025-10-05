'use client';
import { findA, findN, distribute, populateRings } from './d3';
import { Member, ParliamentSnapshot } from './types';

import { useParliamentFilters } from './filtersContext';

interface HemicycleReactProps {
  members: Member[];
  width?: number;
  height?: number;
}

const HemicycleReact = ({ members, width = 600, height = 320 }: HemicycleReactProps) => {
  const { apply } = useParliamentFilters();
  const visibleMembers = apply(members);
  if (!visibleMembers || visibleMembers.length === 0) {
    return <div>No data</div>;
  }

  const r0 = 20;
  const totalSeats = visibleMembers.length;
  const numberOfRings = findN(totalSeats, r0);
  const a0 = findA(totalSeats, numberOfRings, r0);

  let ringRadiis: number[] = [];
  for (let i = 1; i <= numberOfRings; i++) {
    ringRadiis[i] = r0 - (i - 1) * a0;
  }
  const seatsPerRing = distribute(ringRadiis, totalSeats);
  const rings = populateRings(seatsPerRing, numberOfRings, r0, a0);

  // Flatten rings and zip with members (simple order mapping for now)
  const flatSeats = rings.flat();
  const seats = flatSeats.map((seat, idx) => ({
    ...seat,
    member: visibleMembers[idx],
  }));

  // Compute viewBox dimensions (simple padding around r0)
  const pad = r0 * 1.2;
  const vbWidth = r0 * 2 + pad * 2;
  const vbHeight = r0 + pad * 2;

  return (
    <svg width={width} height={height} viewBox={`-${pad} -${pad} ${vbWidth} ${vbHeight}`}>
      {seats.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
            cy={s.y}
            r={s.a ? s.a / 2.5 : 2}
            fill={s.member?.party?.color || '#808080'}
        >
          <title>{`${s.member?.label} (${s.member?.party?.label || 'Independent'})`}</title>
        </circle>
      ))}
    </svg>
  );
};

export default HemicycleReact;
