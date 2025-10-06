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
  return (
    <>
      {locked && !inactive && (
        <circle
          cx={seat.x}
          cy={seat.y}
          r={(seat.a ? seat.a / 2.05 : 2.7) * seatScale + 1.5 / seatScale}
          fill='none'
          stroke='#111827'
          strokeWidth={0.8 / seatScale}
          opacity={0.75}
        />
      )}
      <circle
        cx={seat.x}
        cy={seat.y}
        r={(seat.a ? seat.a / 2.05 : 2.7) * seatScale}
        fill={seat.member?.party?.color || '#808080'}
        stroke={locked && !inactive ? '#0f172a' : '#1f2937'}
        strokeWidth={(locked && !inactive ? 0.9 : 0.4) / seatScale}
        data-locked={locked && !inactive ? 'true' : undefined}
      />
    </>
  );
};

export default SeatCircles;
