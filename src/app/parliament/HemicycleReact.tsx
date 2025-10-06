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

import HemicycleExportBar from './components/HemicycleExportBar';
import HemicycleSeats from './components/HemicycleSeats';
import HemicycleTooltip from './components/HemicycleTooltip';
import { exportSvg, exportPng } from './exportUtils';
import { useParliamentFilters } from './filtersContext';
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

  const hasData = members.length > 0;

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
  const downloadSVG = () => {
    if (!svgRef.current) return;
    exportSvg(svgRef.current, 'hemicycle.svg');
  };

  const downloadPNG = () => {
    if (!svgRef.current) return;
    exportPng(svgRef.current, 'hemicycle.png', 3);
  };

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
    <div ref={containerRef} className='w-full mx-auto'>
      <div className='relative w-full aspect-[2/1]'>
        <HemicycleExportBar
          compact={compactTooltip}
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
          onDownloadSVG={downloadSVG}
          onDownloadPNG={downloadPNG}
        />
        <div id='hemicycle-instructions' className='sr-only'>
          Interactive hemicycle: Use Arrow keys to move between seats. Home and
          End jump to first or last seat. Page Up and Page Down move by ten
          seats. Press Enter to repeat the current seat announcement.
        </div>
        {hasData ? (
          <>
            <svg
              ref={svgRef}
              className='absolute inset-0 w-full h-full'
              role='group'
              aria-label={`Hemicycle: ${filteredMembers.length} of ${members.length} seats match current filters`}
              aria-describedby='hemicycle-instructions'
              preserveAspectRatio='xMidYMid meet'
              viewBox={`-${pad} -${pad} ${vbWidth} ${vbHeight}`}
            >
              {/* Seats extracted to component */}
              <HemicycleSeats
                seats={seats}
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
              {/* End seats */}

              <HemicycleTooltip
                tooltip={tooltip}
                pad={pad}
                vbWidth={vbWidth}
                compact={compactTooltip}
                fade={tooltipFade}
              />
              {filteredMembers.length === 0 && (
                <g aria-hidden='true'>
                  <rect
                    x={-pad}
                    y={-pad}
                    width={vbWidth}
                    height={vbHeight}
                    fill='white'
                    opacity={0.6}
                  />
                  <text
                    x={vbWidth / 2 - pad}
                    y={vbHeight / 2 - pad}
                    textAnchor='middle'
                    fill='#374151'
                    fontSize={10}
                    fontFamily='system-ui, sans-serif'
                    fontWeight={600}
                  >
                    No seats match current filters
                  </text>
                </g>
              )}
            </svg>
            <div className='sr-only' aria-live='polite' aria-atomic='true'>
              {liveMessage}
            </div>
          </>
        ) : (
          <div className='p-4 text-sm'>No data</div>
        )}
      </div>
    </div>
  );
};

export default HemicycleReact;
