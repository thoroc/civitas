'use client';
import { findA, findN, distribute, populateRings, Item } from './d3';
import { Member } from './types';
import { useParliamentFilters } from './filtersContext';
import { useRef, useEffect, useState, useMemo } from 'react';

type Leaning = 'left' | 'center' | 'right';

interface HemicycleReactProps {
  members: Member[];
  partyMetaOverride?: Record<string, { leaning: Leaning }>; // optional injected map
}
 
const HemicycleReact = ({ members, partyMetaOverride }: HemicycleReactProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [seatScale, setSeatScale] = useState(1);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; i: number; member: Member } | null>(null);
  const [compactTooltip, setCompactTooltip] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try { return localStorage.getItem('parliamentTooltipMode') !== 'full'; } catch { return true; }
  });
  // Removed unused tooltipVisible state
  const [tooltipFade, setTooltipFade] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0); // roving tabindex index
  const [liveMessage, setLiveMessage] = useState('');
  // Party meta (ideological leaning) loaded from static JSON if available
  const [partyMeta, setPartyMeta] = useState<Record<string, { leaning: Leaning }>>({});
  const [partyMetaLoaded, setPartyMetaLoaded] = useState(false);

  useEffect(() => {
    if (partyMetaOverride) {
      setPartyMeta(partyMetaOverride);
      setPartyMetaLoaded(true);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/data/partyMeta.json', { cache: 'no-store' });
        if (!res.ok) { setPartyMetaLoaded(true); return; }
        const json = await res.json();
        if (cancelled) return;
        // Lazy import to avoid bundling zod schema on initial render path unnecessarily
        const { validatePartyMetaPayload } = await import('./schemas');
        try {
          const parsed = validatePartyMetaPayload(json);
          const map: Record<string, { leaning: Leaning }> = {};
          for (const p of parsed.parties) map[p.id] = { leaning: p.leaning };
          setPartyMeta(map);
        } catch {
          // ignore schema errors; keep empty meta
        }
      } catch {
        // silent fallback
      } finally {
        if (!cancelled) setPartyMetaLoaded(true);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [partyMetaOverride]);

  const { apply } = useParliamentFilters();
  const filteredMembers = apply(members);
  const filteredIds = useMemo(() => new Set(filteredMembers.map(m => m.id)), [filteredMembers]);
  const isFiltered = filteredMembers.length !== members.length;

  const hasData = members.length > 0;

  // Geometry constants & memoized seat layout
  // Increased base radius for larger overall hemicycle
  const r0 = 80;
  const { seats, pad, vbWidth, vbHeight, ringMeta } = useMemo(() => {
    const totalSeats = members.length;
    const numberOfRings = findN(totalSeats, r0);
    const a0 = findA(totalSeats, numberOfRings, r0);
    const ringRadiis: number[] = [];
    for (let i = 1; i <= numberOfRings; i++) {
      ringRadiis[i] = r0 - (i - 1) * a0;
    }
    const seatsPerRing = distribute(ringRadiis, totalSeats);
    const rings = populateRings(seatsPerRing, numberOfRings, r0, a0);
    const ringMeta: { start: number; end: number; size: number }[] = [];
    const flatSeats: Item[] = [];
    let cursor = 0;
    rings.forEach(r => {
      const start = cursor;
      r.forEach(pt => { flatSeats.push(pt); cursor++; });
      const end = cursor - 1;
      ringMeta.push({ start, end, size: end - start + 1 });
    });

    // ---- Party / ideology based contiguous wedge ordering ----
    type Leaning = 'left' | 'center' | 'right';
    const LEANING_ORDER: Leaning[] = ['left', 'center', 'right'];

    const classifyMember = (m: Member): Leaning => {
      const pid = m.party?.id;
      if (pid && partyMeta[pid]?.leaning) return partyMeta[pid].leaning;
      const label = m.party?.label?.toLowerCase() || '';
      if (/green|labour|social|democrat|sinn|plaid|sdlp|alliance/.test(label)) return 'left';
      if (/conservative|unionist|reform|libertarian|ukip/.test(label)) return 'right';
      if (/liberal/.test(label)) return 'center';
      return 'center';
    };

    interface PartyGroup { id: string; label: string; members: Member[]; leaning: Leaning; color?: string; }
    const partyGroupsMap = new Map<string, PartyGroup>();

    for (const m of members) {
      const partyId = m.party?.id || '__independent';
      let pg = partyGroupsMap.get(partyId);
      if (!pg) {
        pg = { id: partyId, label: m.party?.label || 'Independent', members: [], leaning: classifyMember(m), color: m.party?.color };
        partyGroupsMap.set(partyId, pg);
      }
      pg.members.push(m);
    }

    let partyGroups = Array.from(partyGroupsMap.values());
    partyGroups.sort((a, b) => {
      const leanDiff = LEANING_ORDER.indexOf(a.leaning) - LEANING_ORDER.indexOf(b.leaning);
      if (leanDiff !== 0) return leanDiff;
      const sizeDiff = b.members.length - a.members.length;
      if (sizeDiff !== 0) return sizeDiff;
      return a.label.localeCompare(b.label);
    });

    const partyOrderIndex: Record<string, number> = {};
    partyGroups.forEach((pg, idx) => { partyOrderIndex[pg.id] = idx; });

    const remainingPerParty: Record<string, number> = {};
    partyGroups.forEach(pg => { remainingPerParty[pg.id] = pg.members.length; });
    let remainingTotal = totalSeats;

    const nextIndexPerParty: Record<string, number> = {};
    partyGroups.forEach(pg => { nextIndexPerParty[pg.id] = 0; });

    const assignedMembersByRing: Member[][] = [];

    // Allocate seats ring by ring, proportional to remaining seats per party to keep wedges contiguous across rings.
    for (let ringIdx = 1; ringIdx <= numberOfRings; ringIdx++) {
      const ringSeatCount = seatsPerRing[ringIdx];
      const allocations: { partyId: string; base: number; remainder: number }[] = [];
      let baseSum = 0;

      for (const pg of partyGroups) {
        const remaining = remainingPerParty[pg.id];
        if (remaining <= 0 || remainingTotal === 0) {
          allocations.push({ partyId: pg.id, base: 0, remainder: 0 });
          continue;
        }
        const quota = (remaining / remainingTotal) * ringSeatCount;
        const base = Math.floor(quota);
        const remainder = quota - base;
        allocations.push({ partyId: pg.id, base, remainder });
        baseSum += base;
      }

      let leftover = ringSeatCount - baseSum;
      // Distribute leftover seats by largest remainder
      allocations.sort((a, b) => b.remainder - a.remainder);
      for (let i = 0; i < allocations.length && leftover > 0; i++) {
        if (remainingPerParty[allocations[i].partyId] > 0) {
          allocations[i].base += 1;
          leftover--;
        }
      }
      // Restore original ideological ordering
      allocations.sort((a, b) => partyOrderIndex[a.partyId] - partyOrderIndex[b.partyId]);

      const ringAssigned: Member[] = [];
      for (const alloc of allocations) {
        let take = Math.min(alloc.base, remainingPerParty[alloc.partyId]);
        if (take <= 0) continue;
        const pg = partyGroups[partyOrderIndex[alloc.partyId]]; // safe by construction
        const start = nextIndexPerParty[alloc.partyId];
        const end = start + take;
        const slice = pg.members.slice(start, end);
        ringAssigned.push(...slice);
        nextIndexPerParty[alloc.partyId] = end;
        remainingPerParty[alloc.partyId] -= take;
        remainingTotal -= take;
      }

      // If due to rounding we underfilled/overfilled the ring, patch with any remaining members.
      if (ringAssigned.length < ringSeatCount) {
        for (const pg of partyGroups) {
          while (ringAssigned.length < ringSeatCount && remainingPerParty[pg.id] > 0) {
            const idx = nextIndexPerParty[pg.id];
            ringAssigned.push(pg.members[idx]);
            nextIndexPerParty[pg.id] = idx + 1;
            remainingPerParty[pg.id] -= 1;
            remainingTotal -= 1;
          }
          if (ringAssigned.length === ringSeatCount) break;
        }
      }
      assignedMembersByRing.push(ringAssigned);
    }

    let orderedMembers: Member[] = assignedMembersByRing.flat();
    if (orderedMembers.length !== members.length) {
      // Fallback to original ordering on mismatch
      orderedMembers = members.slice();
    }

    const mappedSeats = flatSeats.map((seat, idx) => ({
      ...seat,
      x: seat.x + r0,
      y: seat.y + r0,
      member: orderedMembers[idx],
      active: filteredIds.has(orderedMembers[idx]?.id),
    }));

    const padLocal = 10;
    const vbWidthLocal = r0 * 2 + padLocal * 2;
    const vbHeightLocal = r0 + padLocal * 2;
    return { seats: mappedSeats, pad: padLocal, vbWidth: vbWidthLocal, vbHeight: vbHeightLocal, ringMeta };
  }, [members, filteredIds, partyMeta]);
  const aspectPaddingPercent = (vbHeight / vbWidth) * 100;
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);

  const findRingForIndex = (idx: number) => ringMeta.findIndex(r => idx >= r.start && idx <= r.end);
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
        const h = entry.contentRect.height || w / 2; const scale = Math.min(3.4, Math.max(0.9, Math.min(w / 360, h / 200)));
        setSeatScale(scale);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Live region updates when tooltip target changes
  useEffect(() => {
    if (tooltip) {
      const partyPart = tooltip.member.party?.label ? `, ${tooltip.member.party.label}` : '';
      setLiveMessage(`Seat ${tooltip.i + 1}: ${tooltip.member.label}${partyPart}`);
    }
  }, [tooltip]);

  // Export helpers
  const downloadSVG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/)) {
      source = source.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hemicycle.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPNG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/)) {
      source = source.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 3; // higher scale for sharper export
      // Use bounding box width/height if available else fallback to client sizes
      const bbox = svgRef.current!.getBoundingClientRect();
      canvas.width = Math.max(1, bbox.width) * scale;
      canvas.height = Math.max(1, bbox.height) * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(b => {
          if (!b) return;
          const pngUrl = URL.createObjectURL(b);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = 'hemicycle.png';
          a.click();
          URL.revokeObjectURL(pngUrl);
        });
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Tooltip rendering logic with boundary-aware positioning
  const renderTooltip = () => {
    if (!tooltip) return null;
    const hasParty = Boolean(tooltip.member.party?.label);
    const maxW = vbWidth * 0.24; // Slightly wider for readability
    const primaryLabel = tooltip.member.label;
    const secondaryLabel = hasParty ? tooltip.member.party!.label : '';
    const approxChar = 5;
    const desiredPrimary = primaryLabel.length * approxChar + 10;
    const desiredSecondary = hasParty ? secondaryLabel.length * (approxChar - 0.8) + 10 : 0;
    const w = Math.min(maxW, Math.max(42, desiredPrimary, desiredSecondary));
    const h = hasParty && !compactTooltip ? 30 : hasParty ? 22 : 18;
    const capacityPrimary = Math.floor((w - 8) / approxChar);
    const displayedPrimary = primaryLabel.length > capacityPrimary ? primaryLabel.slice(0, Math.max(0, capacityPrimary - 1)) + '…' : primaryLabel;
    const capacitySecondary = hasParty ? Math.floor((w - 8) / (approxChar - 0.8)) : 0;
    const displayedSecondary = hasParty && secondaryLabel.length > capacitySecondary ? secondaryLabel.slice(0, Math.max(0, capacitySecondary - 1)) + '…' : secondaryLabel;
    const leftLimit = -pad;
    const rightLimit = -pad + vbWidth;
    let offsetX = 10;
    if (tooltip.x + offsetX + w > rightLimit) {
      offsetX = -w - 10;
      if (tooltip.x + offsetX < leftLimit) {
        offsetX = Math.min(Math.max(leftLimit - tooltip.x, -w / 2), rightLimit - tooltip.x - w);
      }
    }
    const offsetY = -h / 2;
    const bgColor = '#1F3A60'; // theme primary base
    const secondaryTextColor = '#E5E9EF';
    const partyColor = tooltip.member.party?.color || '#6B7280';
    return (
      <g transform={`translate(${tooltip.x}, ${tooltip.y})`} pointerEvents="none" className={tooltipFade ? 'opacity-100 transition-opacity duration-100' : 'opacity-0 transition-opacity duration-100'}>
        <rect x={offsetX} y={offsetY} rx={4} ry={4} width={w} height={h} fill={bgColor} opacity={0.95} stroke={partyColor} strokeWidth={0.6} />
        <text x={offsetX + 6} y={offsetY + 12} fill="#FFFFFF" fontSize={9} fontFamily="system-ui, sans-serif" fontWeight={600}>
          {displayedPrimary}
        </text>
        {hasParty && (
          <text x={offsetX + 6} y={offsetY + (compactTooltip ? 20 : 22)} fill={secondaryTextColor} fontSize={7} fontFamily="system-ui, sans-serif">
            {displayedSecondary}
          </text>
        )}
        {!compactTooltip && (
          <text x={offsetX + 6} y={offsetY + h - 5} fill={secondaryTextColor} fontSize={6} fontFamily="system-ui, sans-serif" letterSpacing={0.5}>
            Seat {tooltip.i + 1}
          </text>
        )}
      </g>
    );
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
      const targetNode = nodeList[idx] as SVGGElement | undefined;
      if (targetNode) (targetNode as any).focus();
    });
  };

  return (
    <div ref={containerRef} className="w-full mx-auto">
      <div className="relative w-full aspect-[2/1]">
        <div className="absolute top-2 right-2 flex gap-2 z-20">
          <button type="button" className="btn btn-xs" onClick={() => {
            setCompactTooltip(c => {
              const next = !c; try { localStorage.setItem('parliamentTooltipMode', next ? 'compact' : 'full'); } catch {}
              return next;
            });
          }} aria-label={compactTooltip ? 'Switch to full tooltip' : 'Switch to compact tooltip'}>
            {compactTooltip ? 'Full' : 'Compact'}
          </button>
          <button type="button" className="btn btn-xs" onClick={downloadSVG} aria-label="Download SVG hemicycle">SVG</button>
          <button type="button" className="btn btn-xs" onClick={downloadPNG} aria-label="Download PNG hemicycle">PNG</button>
        </div>
        <div id="hemicycle-instructions" className="sr-only">
          Interactive hemicycle: Use Arrow keys to move between seats. Home and End jump to first or last seat. Page Up and Page Down move by ten seats. Press Enter to repeat the current seat announcement.
        </div>
        {hasData ? (
          <>
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full"
              role="group"
              aria-label={`Hemicycle: ${filteredMembers.length} of ${members.length} seats match current filters`}
              aria-describedby="hemicycle-instructions"
              preserveAspectRatio="xMidYMid meet"
              viewBox={`-${pad} -${pad} ${vbWidth} ${vbHeight}`}
            >
              {seats.map((s, i) => {
                const inactive = !s.active;
                return (
                  <g key={i} data-seat tabIndex={focusIndex === i && s.active ? 0 : -1}
                    className={inactive ? 'opacity-35 transition-opacity' : 'opacity-100 transition-opacity'}
                    onMouseEnter={() => { if (inactive) return; setTooltip({ x: s.x, y: s.y, i, member: s.member }); setTooltipFade(true); setFocusIndex(i); }}
                    onMouseLeave={() => { if (inactive) return; if (lockedIndex !== i) { setTooltipFade(false); setTimeout(() => { if (lockedIndex !== i) { setTooltip(null); } }, 200); } }}
                    onFocus={() => { if (inactive) return; setFocusIndex(i); setTooltip({ x: s.x, y: s.y, i, member: s.member }); setTooltipFade(true); }}
                    onBlur={() => { if (inactive) return; if (lockedIndex !== i) { setTooltipFade(false); setTimeout(() => { if (lockedIndex !== i) { setTooltip(null); } }, 200); } }}
                    onClick={() => { if (inactive) return; setFocusIndex(i); setTooltip({ x: s.x, y: s.y, i, member: s.member }); setTooltipFade(true); setLockedIndex(prev => prev === i ? null : i); }}
                    onKeyDown={(e) => {
                      const total = seats.length;
                      if (e.key === 'ArrowRight') { e.preventDefault(); moveFocus((i + 1) % total, 1); }
                      else if (e.key === 'ArrowLeft') { e.preventDefault(); moveFocus((i - 1 + total) % total, -1); }
                      else if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(moveVertical(i, -1), -1); }
                      else if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(moveVertical(i, 1), 1); }
                      else if (e.key === 'Home') { e.preventDefault(); moveFocus(0, 1); }
                      else if (e.key === 'End') { e.preventDefault(); moveFocus(total - 1, -1); }
                      else if (e.key === 'PageDown') { e.preventDefault(); moveFocus(Math.min(total - 1, i + 10), 1); }
                      else if (e.key === 'PageUp') { e.preventDefault(); moveFocus(Math.max(0, i - 10), -1); }
                      else if (!inactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setLockedIndex(prev => prev === i ? null : i); if (tooltip) setLiveMessage(`Seat ${i + 1} ${lockedIndex === i ? 'unlocked' : 'locked'}`); }
                    }}
                    role="button"
                    aria-disabled={inactive ? 'true' : undefined}
                    aria-pressed={!inactive && lockedIndex === i ? 'true' : 'false'}
                    aria-label={`Seat ${i + 1}: ${s.member.label}${s.member.party?.label ? ', ' + s.member.party.label : ''}${inactive ? ' (filtered out)' : ''}`}
                  >
                    <title>{`${s.member.label}${s.member.party?.label ? ' – ' + s.member.party.label : ''}${inactive ? ' (filtered out)' : ''}`}</title>
                    {lockedIndex === i && !inactive && (
                      <circle
                        cx={s.x}
                        cy={s.y}
                        r={(s.a ? s.a / 2.05 : 2.7) * seatScale + (1.5 / seatScale)}
                        fill="none"
                        stroke="#111827"
                        strokeWidth={0.8 / seatScale}
                        opacity={0.75}
                      />
                    )}
                    <circle
                      cx={s.x}
                      cy={s.y}
                      r={(s.a ? s.a / 2.05 : 2.7) * seatScale}
                      fill={s.member?.party?.color || '#808080'}
                      stroke={lockedIndex === i && !inactive ? '#0f172a' : '#1f2937'}
                      strokeWidth={(lockedIndex === i && !inactive ? 0.9 : 0.4) / seatScale}
                      data-locked={lockedIndex === i && !inactive ? 'true' : undefined}
                    />
                  </g>
                );
              })}
              {renderTooltip()}
              {filteredMembers.length === 0 && (
                <g aria-hidden="true">
                  <rect x={-pad} y={-pad} width={vbWidth} height={vbHeight} fill="white" opacity={0.6} />
                  <text x={vbWidth/2 - pad} y={vbHeight/2 - pad} textAnchor="middle" fill="#374151" fontSize={10} fontFamily="system-ui, sans-serif" fontWeight={600}>
                    No seats match current filters
                  </text>
                </g>
              )}
            </svg>
            <div className="sr-only" aria-live="polite" aria-atomic="true">{liveMessage}</div>
          </>
        ) : (
          <div className="p-4 text-sm">No data</div>
        )}
      </div>
    </div>
  );
};

export default HemicycleReact;
