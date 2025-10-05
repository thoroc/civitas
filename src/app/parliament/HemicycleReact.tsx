'use client';
import { findA, findN, distribute, populateRings } from './d3';
import { Member, ParliamentSnapshot } from './types';

import { useParliamentFilters } from './filtersContext';
import { useRef, useEffect, useState } from 'react';

interface HemicycleReactProps {
  members: Member[];
  width?: number;
  height?: number;
}

const HemicycleReact = ({ members, width = 900, height = 480 }: HemicycleReactProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [seatScale, setSeatScale] = useState(1);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; member: Member } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        // Base scale around 600px width; cap min/max
        const scale = Math.min(1.8, Math.max(0.6, w / 600));
        setSeatScale(scale);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const { apply } = useParliamentFilters();
  const visibleMembers = apply(members);
  if (!visibleMembers || visibleMembers.length === 0) {
    return <div>No data</div>;
  }

  const r0 = 40;
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
    <div ref={containerRef} className="w-full mx-auto">
      <div className="relative w-full" style={{ paddingBottom: '55%' }}>
        <svg
          className="absolute inset-0 w-full h-full"
          role="img"
          aria-label={`Hemicycle showing ${visibleMembers.length} members`}
          preserveAspectRatio="xMidYMid meet"
          viewBox={`-${pad} -${pad} ${vbWidth} ${vbHeight}`}
        >
          {seats.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={(s.a ? s.a / 2.2 : 2.4) * seatScale}
              fill={s.member?.party?.color || '#808080'}
              stroke="#1f2937"
              strokeWidth={0.4 / seatScale}
              onMouseEnter={() => setTooltip({ x: s.x, y: s.y, member: s.member })}
              onMouseLeave={() => setTooltip(null)}
              onFocus={() => setTooltip({ x: s.x, y: s.y, member: s.member })}
              onBlur={() => setTooltip(null)}
              tabIndex={0}
            />
          ))}
          {tooltip && (
            <g transform={`translate(${tooltip.x}, ${tooltip.y})`}>
              <rect x={6} y={-4} rx={2} ry={2} fill="#111827" opacity={0.85} height={28} width={180} />
              <text x={10} y={12} fill="#fff" fontSize={10} fontFamily="system-ui, sans-serif">
                {tooltip.member.label}
              </text>
              {tooltip.member.party?.label && (
                <text x={10} y={22} fill="#d1d5db" fontSize={9} fontFamily="system-ui, sans-serif">
                  {tooltip.member.party.label}
                </text>
              )}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default HemicycleReact;
