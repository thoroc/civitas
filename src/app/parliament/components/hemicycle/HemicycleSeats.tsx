import React from 'react';

import { HemicycleLayoutResult } from '../../hooks/useHemicycleLayout';
import { Member } from '../../types';

import Seat from './Seat';

export type SeatTooltip = {
  x: number;
  y: number;
  i: number;
  member: Member;
};

interface HemicycleSeatsProps {
  seats: HemicycleLayoutResult['seats'];
  seatScale: number;
  focusIndex: number;
  lockedIndex: number | null;
  tooltip: SeatTooltip | null;
  moveFocus: (targetIndex: number, direction?: 1 | -1) => void;
  moveVertical: (current: number, direction: 1 | -1) => number;
  setFocusIndex: (i: number) => void;
  setLockedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setTooltip: React.Dispatch<React.SetStateAction<SeatTooltip | null>>;
  setTooltipFade: React.Dispatch<React.SetStateAction<boolean>>;
  setLiveMessage: (msg: string) => void;
}

const HemicycleSeats: React.FC<HemicycleSeatsProps> = ({
  seats,
  seatScale,
  focusIndex,
  lockedIndex,
  tooltip,
  moveFocus,
  moveVertical,
  setFocusIndex,
  setLockedIndex,
  setTooltip,
  setTooltipFade,
  setLiveMessage,
}) => {
  return (
    <>
      {seats.map((seat, i) => (
        <Seat
          key={i}
          seat={seat}
          index={i}
          seatScale={seatScale}
          focusIndex={focusIndex}
          lockedIndex={lockedIndex}
          tooltip={tooltip}
          moveFocus={moveFocus}
          moveVertical={moveVertical}
          setFocusIndex={setFocusIndex}
          setLockedIndex={setLockedIndex}
          setTooltip={setTooltip}
          setTooltipFade={setTooltipFade}
          setLiveMessage={setLiveMessage}
        />
      ))}
    </>
  );
};

export default HemicycleSeats;
