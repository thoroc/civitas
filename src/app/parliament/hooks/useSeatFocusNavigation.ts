import { useCallback } from 'react';

import { HemicycleLayoutResult } from './useHemicycleLayout';

interface UseSeatFocusNavigationParams {
  seats: HemicycleLayoutResult['seats'];
  ringMeta: { start: number; end: number; size: number }[];
  svgRef: React.RefObject<SVGSVGElement>;
  setFocusIndex: (i: number) => void;
  setTooltip: (t: any) => void; // kept generic to avoid circular type import
  setTooltipFade: (b: boolean) => void;
}

/**
 * useSeatFocusNavigation
 * ----------------------
 * Provides focus movement helpers (moveFocus + moveVertical) encapsulating logic
 * for skipping inactive seats and ring-to-ring vertical transitions.
 */
const useSeatFocusNavigation = ({
  seats,
  ringMeta,
  svgRef,
  setFocusIndex,
  setTooltip,
  setTooltipFade,
}: UseSeatFocusNavigationParams) => {
  const findRingForIndex = useCallback(
    (idx: number) => ringMeta.findIndex(r => idx >= r.start && idx <= r.end),
    [ringMeta]
  );

  const moveVertical = useCallback(
    (current: number, direction: 1 | -1) => {
      const ringIdx = findRingForIndex(current);
      if (ringIdx === -1) return current;
      const targetRing = ringMeta[ringIdx + direction];
      if (!targetRing) return current;
      const ring = ringMeta[ringIdx];
      const offsetInRing = current - ring.start;
      const ratio = offsetInRing / (ring.size - 1 || 1);
      const targetOffset = Math.round(ratio * (targetRing.size - 1));
      return targetRing.start + targetOffset;
    },
    [findRingForIndex, ringMeta]
  );

  const moveFocus = useCallback(
    (targetIndex: number, direction: 1 | -1 = 1) => {
      if (targetIndex < 0 || targetIndex >= seats.length) return;
      let idx = targetIndex;
      while (idx >= 0 && idx < seats.length && !seats[idx].active) {
        idx += direction;
      }
      if (idx < 0 || idx >= seats.length) return;
      setFocusIndex(idx);
      const seat = seats[idx];
      if (seat.active) {
        setTooltip({ x: seat.x, y: seat.y, i: idx, member: seat.member });
        setTooltipFade(true);
      } else {
        setTooltip(null);
      }
      requestAnimationFrame(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const nodeList = svg.querySelectorAll('g[data-seat]');
        const targetNode = nodeList.item(idx) as SVGGElement | null;
        if (targetNode) targetNode.focus();
      });
    },
    [seats, setFocusIndex, setTooltip, setTooltipFade, svgRef]
  );

  return { moveFocus, moveVertical };
};

export default useSeatFocusNavigation;
