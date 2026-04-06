import { useMemo, useRef, useState } from 'react';

import { useParliamentFilters } from '../context/filters-context';
import type { Member } from '../types';

import useHemicycleExport from './use-hemicycle-export';
import useHemicycleLayout from './use-hemicycle-layout';
import { useHemicycleTooltipState } from './use-hemicycle-tooltip-state';
import useLiveAnnouncements from './use-live-announcements';
import usePartyMeta, { type Leaning } from './use-party-meta';
import useResponsiveSeatScale from './use-responsive-seat-scale';
import useSeatFocusNavigation from './use-seat-focus-navigation';

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
