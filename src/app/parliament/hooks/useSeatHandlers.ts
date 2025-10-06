import { useCallback, useMemo } from 'react';

import { SeatTooltip } from '../components/hemicycle/HemicycleSeats';
import {
  buildKeyHandler,
  buildSeatInteractions,
} from '../components/hemicycle/seatInteractions';

import { HemicycleLayoutResult } from './useHemicycleLayout';

interface UseSeatHandlersArgs {
  inactive: boolean;
  index: number;
  seat: HemicycleLayoutResult['seats'][number];
  lockedIndex: number | null;
  tooltip: SeatTooltip | null;
  moveFocus: (targetIndex: number, direction?: 1 | -1) => void;
  moveVertical: (current: number, direction: 1 | -1) => number;
  setTooltip: React.Dispatch<React.SetStateAction<SeatTooltip | null>>;
  setTooltipFade: React.Dispatch<React.SetStateAction<boolean>>;
  setFocusIndex: (i: number) => void;
  setLockedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setLiveMessage: (msg: string) => void;
}

/**
 * useSeatHandlers
 * ----------------
 * Consolidates per-seat interaction logic (hover/focus tooltip display,
 * locking, keyboard navigation) into a single reusable hook. This keeps the
 * Seat component lean while preserving existing behavior.
 */
const useSeatHandlers = ({
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
}: UseSeatHandlersArgs) => {
  const { show, hideIfUnlocked, toggleLock } = useMemo(
    () =>
      buildSeatInteractions({
        inactive,
        index,
        seat,
        lockedIndex,
        setTooltip,
        setTooltipFade,
        setFocusIndex,
        setLockedIndex,
      }),
    [
      inactive,
      index,
      seat,
      lockedIndex,
      setTooltip,
      setTooltipFade,
      setFocusIndex,
      setLockedIndex,
    ]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGGElement>) => {
      return buildKeyHandler({
        index,
        inactive,
        lockedIndex,
        tooltip,
        nav: { moveFocus, moveVertical },
        setLockedIndex,
        setLiveMessage,
      })(e);
    },
    [
      index,
      inactive,
      lockedIndex,
      tooltip,
      moveFocus,
      moveVertical,
      setLockedIndex,
      setLiveMessage,
    ]
  );

  return {
    showTooltip: show,
    hideTooltipIfUnlocked: hideIfUnlocked,
    toggleLock,
    handleKeyDown,
  };
};

export default useSeatHandlers;
