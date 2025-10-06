import React from 'react';

import { HemicycleLayoutResult } from '../hooks/useHemicycleLayout';

import { SeatTooltip } from './HemicycleSeats';

export interface NavigationFns {
  moveFocus: (targetIndex: number, direction?: 1 | -1) => void;
  moveVertical: (current: number, direction: 1 | -1) => number;
}

export interface KeyHandlerArgs {
  index: number;
  inactive: boolean;
  lockedIndex: number | null;
  tooltip: SeatTooltip | null;
  nav: NavigationFns;
  setLockedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setLiveMessage: (msg: string) => void;
}

export const buildKeyHandler = ({
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

export interface SeatInteractionParams {
  inactive: boolean;
  index: number;
  seat: HemicycleLayoutResult['seats'][number];
  lockedIndex: number | null;
  setTooltip: React.Dispatch<React.SetStateAction<SeatTooltip | null>>;
  setTooltipFade: React.Dispatch<React.SetStateAction<boolean>>;
  setFocusIndex: (i: number) => void;
  setLockedIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

export const buildSeatInteractions = ({
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
