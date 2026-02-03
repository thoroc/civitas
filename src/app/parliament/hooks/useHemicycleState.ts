import { useMemo, useRef, useState } from 'react';

import { useParliamentFilters } from '../context/filtersContext';
import { Member } from '../types';

import useHemicycleExport from './useHemicycleExport';
import useHemicycleLayout from './useHemicycleLayout';
import { useHemicycleTooltipState } from './useHemicycleTooltipState';
import useLiveAnnouncements from './useLiveAnnouncements';
import usePartyMeta, { Leaning } from './usePartyMeta';
import useResponsiveSeatScale from './useResponsiveSeatScale';
import useSeatFocusNavigation from './useSeatFocusNavigation';

interface UseHemicycleStateOptions {
  members: Member[];
  partyMetaOverride?: Record<string, { leaning: Leaning }>;
}

export const useHemicycleState = ({
  members,
  partyMetaOverride,
}: UseHemicycleStateOptions) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const seatScale = useResponsiveSeatScale(containerRef);

  const [focusIndex, setFocusIndex] = useState(0);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const [liveMessage, setLiveMessage] = useState('');

  const {
    tooltip,
    setTooltip,
    tooltipFade,
    setTooltipFade,
    compactTooltip,
    toggleCompactTooltip,
  } = useHemicycleTooltipState();

  const partyMeta = usePartyMeta({ partyMetaOverride });
  const { apply } = useParliamentFilters();
  const filteredMembers = apply(members);
  const filteredIds = useMemo(
    () => new Set(filteredMembers.map(m => m.id)),
    [filteredMembers]
  );

  useLiveAnnouncements({ tooltip, members, filteredMembers, setLiveMessage });

  const { seats, pad, vbWidth, vbHeight, ringMeta } = useHemicycleLayout({
    members,
    filteredIds,
    partyMeta,
  });

  const { downloadSVG, downloadPNG } = useHemicycleExport({
    getSvg: () => svgRef.current,
  });

  const { moveFocus, moveVertical } = useSeatFocusNavigation({
    seats,
    ringMeta,
    svgRef,
    setFocusIndex,
    setTooltip: t => setTooltip(t),
    setTooltipFade,
  });

  const controller = {
    containerRef,
    svgRef,
    pad,
    vbWidth,
    vbHeight,
    seats,
    seatScale,
    members,
    filteredMembers,
    tooltip,
    setTooltip,
    tooltipFade,
    setTooltipFade,
    compactTooltip,
    toggleCompactTooltip,
    lockedIndex,
    setLockedIndex,
    focusIndex,
    setFocusIndex,
    liveMessage,
    setLiveMessage,
    downloadSVG,
    downloadPNG,
    moveFocus,
    moveVertical,
  } as const;

  return controller;
};

export type HemicycleController = ReturnType<typeof useHemicycleState>;
