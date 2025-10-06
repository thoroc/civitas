'use client';
/**
 * HemicycleReact
 * --------------
 * Top-level interactive hemicycle visualization: orchestrates data filtering,
 * layout (useHemicycleLayout), accessibility live announcements, tooltip/lock
 * state, and export actions. Rendering of individual seats is delegated to
 * HemicycleSeats for clarity and reduced per-render complexity.
 */
import { useRef, useState, useMemo } from 'react';

import HemicycleView from './components/HemicycleView';
import { useParliamentFilters } from './filtersContext';
import useHemicycleExport from './hooks/useHemicycleExport';
import useHemicycleLayout from './hooks/useHemicycleLayout';
import useLiveAnnouncements from './hooks/useLiveAnnouncements';
import usePartyMeta, { Leaning } from './hooks/usePartyMeta';
import useResponsiveSeatScale from './hooks/useResponsiveSeatScale';
import useSeatFocusNavigation from './hooks/useSeatFocusNavigation';
import { Member } from './types';

interface HemicycleReactProps {
  members: Member[];
  partyMetaOverride?: Record<string, { leaning: Leaning }>; // optional injected map
}

const HemicycleReact = ({
  members,
  partyMetaOverride,
}: HemicycleReactProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const seatScale = useResponsiveSeatScale(containerRef);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    i: number;
    member: Member;
  } | null>(null);
  const [compactTooltip, setCompactTooltip] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem('parliamentTooltipMode') !== 'full';
    } catch {
      return true;
    }
  });
  // Removed unused tooltipVisible state
  const [tooltipFade, setTooltipFade] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0); // roving tabindex index
  const [liveMessage, setLiveMessage] = useState('');

  // Party meta via custom hook (ideological leaning metadata)
  const partyMeta = usePartyMeta({ partyMetaOverride });

  const { apply } = useParliamentFilters();
  const filteredMembers = apply(members);
  const filteredIds = useMemo(
    () => new Set(filteredMembers.map(m => m.id)),
    [filteredMembers]
  );

  // Live announcements (filter counts + tooltip focus)
  useLiveAnnouncements({
    tooltip,
    members,
    filteredMembers,
    setLiveMessage,
  });

  // Geometry & seat layout via hook
  const { seats, pad, vbWidth, vbHeight, ringMeta } = useHemicycleLayout({
    members,
    filteredIds,
    partyMeta,
  });
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);

  // Export helpers via utilities
  const { downloadSVG, downloadPNG } = useHemicycleExport({
    getSvg: () => svgRef.current,
  });

  // Focus navigation helpers via hook
  const { moveFocus, moveVertical } = useSeatFocusNavigation({
    seats,
    ringMeta,
    svgRef,
    setFocusIndex,
    setTooltip: t => setTooltip(t),
    setTooltipFade,
  });

  return (
    <HemicycleView
      containerRef={containerRef}
      svgRef={svgRef}
      pad={pad}
      vbWidth={vbWidth}
      vbHeight={vbHeight}
      seats={seats}
      seatScale={seatScale}
      members={members}
      filteredMembers={filteredMembers}
      tooltip={tooltip}
      compactTooltip={compactTooltip}
      tooltipFade={tooltipFade}
      focusIndex={focusIndex}
      lockedIndex={lockedIndex}
      liveMessage={liveMessage}
      downloadSVG={downloadSVG}
      downloadPNG={downloadPNG}
      onToggleCompact={() => {
        setCompactTooltip(c => {
          const next = !c;
          try {
            localStorage.setItem(
              'parliamentTooltipMode',
              next ? 'compact' : 'full'
            );
          } catch {}
          return next;
        });
      }}
      moveFocus={moveFocus}
      moveVertical={moveVertical}
      setFocusIndex={setFocusIndex}
      setLockedIndex={setLockedIndex}
      setTooltip={setTooltip}
      setTooltipFade={setTooltipFade}
      setLiveMessage={setLiveMessage}
    />
  );
};

export default HemicycleReact;
