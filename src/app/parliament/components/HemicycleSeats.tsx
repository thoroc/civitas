import React, { memo, useCallback, useMemo } from 'react';

// Interaction utility types
interface NavigationFns {
  moveFocus: (targetIndex: number, direction?: 1 | -1) => void;
  moveVertical: (current: number, direction: 1 | -1) => number;
}

type KeyHandlerArgs = {
  index: number;
  inactive: boolean;
  lockedIndex: number | null;
  tooltip: SeatTooltip | null;
  nav: NavigationFns;
  setLockedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setLiveMessage: (msg: string) => void;
};

const buildKeyHandler = ({
  index,
  inactive,
  lockedIndex,
  tooltip,
  nav,
  setLockedIndex,
  setLiveMessage,
}: KeyHandlerArgs) => {
  return (e: React.KeyboardEvent<SVGGElement>) => {
    if (inactive) return;
    const key = e.key;
    if (key.startsWith('Arrow')) e.preventDefault();
    switch (key) {
      case 'ArrowRight':
        nav.moveFocus(index + 1, 1);
        break;
      case 'ArrowLeft':
        nav.moveFocus(index - 1, -1);
        break;
      case 'ArrowUp':
        nav.moveFocus(nav.moveVertical(index, -1), -1);
        break;
      case 'ArrowDown':
        nav.moveFocus(nav.moveVertical(index, 1), 1);
        break;
      case 'Home':
        e.preventDefault();
        nav.moveFocus(0, 1);
        break;
      case 'End':
        e.preventDefault();
        nav.moveFocus(Number.MAX_SAFE_INTEGER, -1);
        break;
      case 'PageDown':
        e.preventDefault();
        nav.moveFocus(index + 10, 1);
        break;
      case 'PageUp':
        e.preventDefault();
        nav.moveFocus(index - 10, -1);
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        setLockedIndex(prev => (prev === index ? null : index));
        if (tooltip) {
          setLiveMessage(
            `Seat ${index + 1} ${lockedIndex === index ? 'unlocked' : 'locked'}`
          );
        }
        break;
      }
      default:
        break;
    }
  };
};

// Consolidated seat interaction utilities to reduce inline component complexity
interface SeatInteractionParams {
  inactive: boolean;
  index: number;
  seat: HemicycleLayoutResult['seats'][number];
  lockedIndex: number | null;
  setTooltip: React.Dispatch<React.SetStateAction<SeatTooltip | null>>;
  setTooltipFade: React.Dispatch<React.SetStateAction<boolean>>;
  setFocusIndex: (i: number) => void;
  setLockedIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

const buildSeatInteractions = ({
  inactive,
  index,
  seat,
  lockedIndex,
  setTooltip,
  setTooltipFade,
  setFocusIndex,
  setLockedIndex,
}: SeatInteractionParams) => {
  const show = () => {
    if (inactive) return;
    setTooltip({ x: seat.x, y: seat.y, i: index, member: seat.member });
    setTooltipFade(true);
    setFocusIndex(index);
  };
  const hideIfUnlocked = () => {
    if (inactive) return;
    if (lockedIndex !== index) {
      setTooltipFade(false);
      setTimeout(() => {
        if (lockedIndex !== index) setTooltip(null);
      }, 200);
    }
  };
  const toggleLock = () => {
    if (inactive) return;
    setFocusIndex(index);
    setTooltip({ x: seat.x, y: seat.y, i: index, member: seat.member });
    setTooltipFade(true);
    setLockedIndex(prev => (prev === index ? null : index));
  };
  return { show, hideIfUnlocked, toggleLock };
};

import { HemicycleLayoutResult } from '../hooks/useHemicycleLayout';
import { Member } from '../types';

/**
 * HemicycleSeats
 * -----------------
 * Renders the collection of hemicycle seat nodes (<g data-seat />) and delegates
 * per-seat interaction (hover, focus, keyboard navigation, locking) to a memoized
 * <Seat /> subcomponent. This extraction keeps the parent HemicycleReact focused on
 * orchestration (layout + global state) while isolating interaction logic here.
 *
 * Accessibility notes:
 * - Roving tabindex: only the focused active seat has tabIndex=0, others -1.
 * - Keyboard: Arrow keys move laterally; Home/End jump ends; PageUp/PageDown jump by 10; Up/Down move between rings via moveVertical.
 * - Enter/Space toggle the locked (pinned) tooltip state.
 * - A hidden live region in the parent announces seat focus and lock changes.
 */

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

/**
 * Seat (memoized)
 * Handles individual seat interaction + rendering. Memoization prevents
 * unnecessary re-renders when unrelated seats update focus/lock state.
 */
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

    const {
      show: showTooltip,
      hideIfUnlocked: hideTooltipIfUnlocked,
      toggleLock,
    } = useMemo(
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
      buildKeyHandler({
        index,
        inactive,
        lockedIndex,
        tooltip,
        nav: { moveFocus, moveVertical },
        setLockedIndex,
        setLiveMessage,
      }),
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

    const ariaLabel = `Seat ${index + 1}: ${seat.member?.label ?? 'Unknown'}${seat.member?.party?.label ? ', ' + seat.member.party.label : ''}${inactive ? ' (filtered out)' : ''}`;
    const titleText = `${seat.member?.label ?? 'Unknown'}${seat.member?.party?.label ? ' – ' + seat.member.party.label : ''}${inactive ? ' (filtered out)' : ''}`;

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
        {lockedIndex === index && !inactive && (
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
          stroke={lockedIndex === index && !inactive ? '#0f172a' : '#1f2937'}
          strokeWidth={
            (lockedIndex === index && !inactive ? 0.9 : 0.4) / seatScale
          }
          data-locked={lockedIndex === index && !inactive ? 'true' : undefined}
        />
      </g>
    );
  }
);
Seat.displayName = 'Seat';

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
