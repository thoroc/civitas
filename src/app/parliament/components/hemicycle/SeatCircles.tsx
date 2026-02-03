import React from 'react';

import { HemicycleLayoutResult } from '../../hooks/useHemicycleLayout';

interface SeatCirclesProps {
  seat: HemicycleLayoutResult['seats'][number];
  seatScale: number;
  locked: boolean;
  inactive: boolean;
}

const SeatCircles: React.FC<SeatCirclesProps> = ({
  seat,
  seatScale,
  locked,
  inactive,
}) => {
  const lockedActive = locked && !inactive;
  const seatRadiusBase = (seat.a ? seat.a / 2.05 : 2.7) * seatScale;
  const partyFill = seat.member?.party?.color || '#808080';
  const strokeColor = lockedActive ? '#0f172a' : '#1f2937';
  const strokeWidth = (lockedActive ? 0.9 : 0.4) / seatScale;
  const outerRadius = seatRadiusBase + 1.5 / seatScale;

  return (
    <>
      {lockedActive && (
        <circle
          cx={seat.x}
          cy={seat.y}
          r={outerRadius}
          fill='none'
          stroke='#111827'
          strokeWidth={0.8 / seatScale}
          opacity={0.75}
        />
      )}
      <circle
        cx={seat.x}
        cy={seat.y}
        r={seatRadiusBase}
        fill={partyFill}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        data-locked={lockedActive ? 'true' : undefined}
      />
    </>
  );
};

export default SeatCircles;
