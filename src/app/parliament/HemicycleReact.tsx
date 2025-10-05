'use client';
import { findA, findN, distribute, populateRings, Item } from './d3';
import { Member } from './types';
import { useParliamentFilters } from './filtersContext';
import { useRef, useEffect, useState, useMemo } from 'react';

interface HemicycleReactProps {
  members: Member[];
}

const HemicycleReact = ({ members }: HemicycleReactProps) => {
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

  const { apply } = useParliamentFilters();
  const visibleMembers = apply(members);

  const hasData = visibleMembers && visibleMembers.length > 0;

  // Geometry constants & memoized seat layout
  const r0 = 40;
  const { seats, pad, vbWidth, vbHeight, ringMeta } = useMemo(() => {
    const totalSeats = visibleMembers.length;
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
    const mappedSeats = flatSeats.map((seat, idx) => ({
      ...seat,
      member: visibleMembers[idx],
    }));
    const padLocal = r0 * 1.2;
    const vbWidthLocal = r0 * 2 + padLocal * 2;
    const vbHeightLocal = r0 + padLocal * 2;
    return { seats: mappedSeats, pad: padLocal, vbWidth: vbWidthLocal, vbHeight: vbHeightLocal, ringMeta };
  }, [visibleMembers]);
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
        const scale = Math.min(1.8, Math.max(0.6, w / 600));
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
  const moveFocus = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= seats.length) return;
    setFocusIndex(targetIndex);
    const seat = seats[targetIndex];
    setTooltip({ x: seat.x, y: seat.y, i: targetIndex, member: seat.member });
    setTooltipFade(true);
    requestAnimationFrame(() => {
      const svg = svgRef.current;
      if (!svg) return;
      const nodeList = svg.querySelectorAll('g[data-seat]');
      const targetNode = nodeList[targetIndex] as SVGGElement | undefined;
      if (targetNode) (targetNode as any).focus();
    });
  };

  return (
    <div ref={containerRef} className="w-full mx-auto">
      <div className="relative w-full" style={{ paddingBottom: `${aspectPaddingPercent}%` }}>
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
              aria-label={`Hemicycle showing ${visibleMembers.length} members`}
              aria-describedby="hemicycle-instructions"
              preserveAspectRatio="xMidYMid meet"
              viewBox={`-${pad} -${pad} ${vbWidth} ${vbHeight}`}
            >
              {seats.map((s, i) => (
                <g key={i} data-seat tabIndex={focusIndex === i ? 0 : -1}
                  onMouseEnter={() => { setTooltip({ x: s.x, y: s.y, i, member: s.member }); setTooltipFade(true); setFocusIndex(i); }}
                  onMouseLeave={() => { if (lockedIndex !== i) { setTooltipFade(false); setTimeout(() => { if (lockedIndex !== i) { setTooltip(null); } }, 200); } }}
                  onFocus={() => { setFocusIndex(i); setTooltip({ x: s.x, y: s.y, i, member: s.member }); setTooltipFade(true); }}
                  onBlur={() => { if (lockedIndex !== i) { setTooltipFade(false); setTimeout(() => { if (lockedIndex !== i) { setTooltip(null); } }, 200); } }}
                  onClick={() => { setFocusIndex(i); setTooltip({ x: s.x, y: s.y, i, member: s.member }); setTooltipFade(true); setLockedIndex(prev => prev === i ? null : i); }}
                  onKeyDown={(e) => {
                    const total = seats.length;
                    if (e.key === 'ArrowRight') { e.preventDefault(); moveFocus((i + 1) % total); }
                    else if (e.key === 'ArrowLeft') { e.preventDefault(); moveFocus((i - 1 + total) % total); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(moveVertical(i, -1)); }
                    else if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(moveVertical(i, 1)); }
                    else if (e.key === 'Home') { e.preventDefault(); moveFocus(0); }
                    else if (e.key === 'End') { e.preventDefault(); moveFocus(total - 1); }
                    else if (e.key === 'PageDown') { e.preventDefault(); moveFocus(Math.min(total - 1, i + 10)); }
                    else if (e.key === 'PageUp') { e.preventDefault(); moveFocus(Math.max(0, i - 10)); }
                    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLockedIndex(prev => prev === i ? null : i); if (tooltip) setLiveMessage(`Seat ${i + 1} ${lockedIndex === i ? 'unlocked' : 'locked'}`); }
                  }}
                  role="button"
                  aria-pressed={lockedIndex === i ? 'true' : 'false'}
                  aria-label={`Seat ${i + 1}: ${s.member.label}${s.member.party?.label ? ', ' + s.member.party.label : ''}`}
                >
                  <title>{`${s.member.label}${s.member.party?.label ? ' – ' + s.member.party.label : ''}`}</title>
                  {lockedIndex === i && (
                    <circle
                      cx={s.x}
                      cy={s.y}
                      r={(s.a ? s.a / 2.2 : 2.4) * seatScale + (1.2 / seatScale)}
                      fill="none"
                      stroke="#111827"
                      strokeWidth={0.8 / seatScale}
                      opacity={0.75}
                    />
                  )}
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={(s.a ? s.a / 2.2 : 2.4) * seatScale}
                    fill={s.member?.party?.color || '#808080'}
                    stroke={lockedIndex === i ? '#0f172a' : '#1f2937'}
                    strokeWidth={(lockedIndex === i ? 0.9 : 0.4) / seatScale}
                    data-locked={lockedIndex === i ? 'true' : undefined}
                  />
                </g>
              ))}
              {renderTooltip()}
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
