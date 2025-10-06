import React, { memo } from 'react';

import { HemicycleLayoutResult } from '../hooks/useHemicycleLayout';
import useSeatHandlers from '../hooks/useSeatHandlers';

import { SeatTooltip } from './HemicycleSeats';
import { buildSeatAria } from './seatAria';
import SeatCircles from './SeatCircles';

interface SeatProps {
  seat: HemicycleLayoutResult['seats'][number];
  index: number;
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

const Seat: React.FC<SeatProps> = memo(
  ({
    seat,
    index,
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
    const inactive = !seat.active;

    const { showTooltip, hideTooltipIfUnlocked, toggleLock, handleKeyDown } =
      useSeatHandlers({
        inactive,
        index,
        seat,
        lockedIndex,
        tooltip,
        moveFocus,
        moveVertical,
        setTooltip,
        setTooltipFade,
        setFocusIndex,
        setLockedIndex,
        setLiveMessage,
      });

    const { ariaLabel, titleText } = buildSeatAria(index, seat, inactive);

    return (
      <g
        data-seat
        tabIndex={focusIndex === index && seat.active ? 0 : -1}
        className={
          inactive
            ? 'opacity-35 transition-opacity'
            : 'opacity-100 transition-opacity'
        }
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltipIfUnlocked}
        onFocus={showTooltip}
        onBlur={hideTooltipIfUnlocked}
        onClick={toggleLock}
        onKeyDown={handleKeyDown}
        role='button'
        aria-disabled={inactive ? 'true' : undefined}
        aria-pressed={!inactive && lockedIndex === index ? 'true' : 'false'}
        aria-label={ariaLabel}
      >
        <title>{titleText}</title>
        <SeatCircles
          seat={seat}
          seatScale={seatScale}
          locked={lockedIndex === index && !inactive}
          inactive={inactive}
        />
      </g>
    );
  }
);
Seat.displayName = 'Seat';

export default Seat;
