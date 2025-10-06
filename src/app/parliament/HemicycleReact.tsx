'use client';
/**
 * HemicycleReact
 * --------------
 * Top-level interactive hemicycle visualization: orchestrates data filtering,
 * layout (useHemicycleLayout), accessibility live announcements, tooltip/lock
 * state, and export actions. Rendering of individual seats is delegated to
 * HemicycleSeats for clarity and reduced per-render complexity.
 */
import { useRef, useEffect, useState, useMemo } from 'react';

import HemicycleExportBar from './components/HemicycleExportBar';
import HemicycleSeats from './components/HemicycleSeats';
import HemicycleTooltip from './components/HemicycleTooltip';
import { exportSvg, exportPng } from './exportUtils';
import { useParliamentFilters } from './filtersContext';
import useHemicycleLayout from './hooks/useHemicycleLayout';
import { Member } from './types';

type Leaning = 'left' | 'center' | 'right';

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
  const [seatScale, setSeatScale] = useState(1);
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
  // Party meta (ideological leaning) loaded from static JSON if available
  const [partyMeta, setPartyMeta] = useState<
    Record<string, { leaning: Leaning }>
  >({});

  useEffect(() => {
    if (partyMetaOverride) {
      setPartyMeta(partyMetaOverride);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/data/partyMeta.json', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        const { validatePartyMetaPayload } = await import('./schemas');
        try {
          const parsed = validatePartyMetaPayload(json);
          const map: Record<string, { leaning: Leaning }> = {};
          for (const p of parsed.parties) map[p.id] = { leaning: p.leaning };
          setPartyMeta(map);
        } catch {
          // ignore schema errors
        }
      } catch {
        // silent fallback
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [partyMetaOverride]);

  const { apply } = useParliamentFilters();
  const filteredMembers = apply(members);
  const filteredIds = useMemo(
    () => new Set(filteredMembers.map(m => m.id)),
    [filteredMembers]
  );

  const hasData = members.length > 0;

  // Announce filter-driven seat count changes (avoids overriding active tooltip announcements)
  useEffect(() => {
    if (!tooltip && members.length) {
      setLiveMessage(
        `${filteredMembers.length} of ${members.length} seats visible`
      );
    }
  }, [filteredMembers.length, members.length, tooltip]);

  // Geometry & seat layout via hook
  const { seats, pad, vbWidth, vbHeight, ringMeta } = useHemicycleLayout({
    members,
    filteredIds,
    partyMeta,
  });
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);

  const findRingForIndex = (idx: number) =>
    ringMeta.findIndex(r => idx >= r.start && idx <= r.end);
  const moveVertical = (current: number, direction: 1 | -1) => {
    const ringIdx = findRingForIndex(current);
    if (ringIdx === -1) return current;
    const targetRing = ringMeta[ringIdx + direction];
    if (!targetRing) return current;
    const ring = ringMeta[ringIdx];
    const offsetInRing = current - ring.start;
    // scale position proportionally into target ring
    const ratio = offsetInRing / (ring.size - 1 || 1);
    const targetOffset = Math.round(ratio * (targetRing.size - 1));
    return targetRing.start + targetOffset;
  };

  // ResizeObserver for responsive seat scaling
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height || w / 2;
        const scale = Math.min(3.4, Math.max(0.9, Math.min(w / 360, h / 200)));
        setSeatScale(scale);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Live region updates when tooltip target changes
  useEffect(() => {
    if (tooltip) {
      const partyPart = tooltip.member.party?.label
        ? `, ${tooltip.member.party.label}`
        : '';
      setLiveMessage(
        `Seat ${tooltip.i + 1}: ${tooltip.member.label}${partyPart}`
      );
    }
  }, [tooltip]);

  // Export helpers via utilities
  const downloadSVG = () => {
    if (!svgRef.current) return;
    exportSvg(svgRef.current, 'hemicycle.svg');
  };

  const downloadPNG = () => {
    if (!svgRef.current) return;
    exportPng(svgRef.current, 'hemicycle.png', 3);
  };

  // Move focus helper
  const moveFocus = (targetIndex: number, direction: 1 | -1 = 1) => {
    if (targetIndex < 0 || targetIndex >= seats.length) return;
    // Skip inactive seats
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
      if (targetNode) {
        targetNode.focus();
      }
    });
  };

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
