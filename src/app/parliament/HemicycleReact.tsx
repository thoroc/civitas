'use client';
import { findA, findN, distribute, populateRings } from './d3';
import { Member } from './types';
import { useParliamentFilters } from './filtersContext';
import { useRef, useEffect, useState, useMemo } from 'react';

interface HemicycleReactProps {
  members: Member[];
  width?: number; // kept for potential external sizing overrides
  height?: number;
}

const HemicycleReact = ({ members, width = 900, height = 480 }: HemicycleReactProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [seatScale, setSeatScale] = useState(1);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; member: Member } | null>(null);

  const { apply } = useParliamentFilters();
  const visibleMembers = apply(members);

  // Early return if no data
  if (!visibleMembers || visibleMembers.length === 0) {
    return <div>No data</div>;
  }

  // Geometry constants & memoized seat layout
  const r0 = 40;
  const { seats, pad, vbWidth, vbHeight } = useMemo(() => {
    const totalSeats = visibleMembers.length;
    const numberOfRings = findN(totalSeats, r0);
    const a0 = findA(totalSeats, numberOfRings, r0);
    const ringRadiis: number[] = [];
    for (let i = 1; i <= numberOfRings; i++) {
      ringRadiis[i] = r0 - (i - 1) * a0;
    }
    const seatsPerRing = distribute(ringRadiis, totalSeats);
    const rings = populateRings(seatsPerRing, numberOfRings, r0, a0);
    const flatSeats = rings.flat();
    const mappedSeats = flatSeats.map((seat, idx) => ({
      ...seat,
      member: visibleMembers[idx],
    }));
    const padLocal = r0 * 1.2;
    const vbWidthLocal = r0 * 2 + padLocal * 2;
    const vbHeightLocal = r0 + padLocal * 2;
    return { seats: mappedSeats, pad: padLocal, vbWidth: vbWidthLocal, vbHeight: vbHeightLocal };
  }, [visibleMembers]);
  const aspectPaddingPercent = (vbHeight / vbWidth) * 100;

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
    const maxW = vbWidth * 0.2; // cap at 20% of hemicycle width
    const primaryLabel = tooltip.member.label;
    const secondaryLabel = hasParty ? tooltip.member.party!.label : '';
    const approxChar = 5; // rough char width basis in viewBox units
    const desiredPrimary = primaryLabel.length * approxChar + 8;
    const desiredSecondary = hasParty ? secondaryLabel.length * (approxChar - 0.8) + 8 : 0;
    const w = Math.min(maxW, Math.max(34, desiredPrimary, desiredSecondary));
    const h = hasParty ? 20 : 16;
    const capacityPrimary = Math.floor((w - 8) / approxChar);
    const displayedPrimary = primaryLabel.length > capacityPrimary ? primaryLabel.slice(0, Math.max(0, capacityPrimary - 1)) + '…' : primaryLabel;
    const capacitySecondary = hasParty ? Math.floor((w - 8) / (approxChar - 0.8)) : 0;
    const displayedSecondary = hasParty && secondaryLabel.length > capacitySecondary ? secondaryLabel.slice(0, Math.max(0, capacitySecondary - 1)) + '…' : secondaryLabel;
    const leftLimit = -pad;
    const rightLimit = -pad + vbWidth;
    // Try right side first
    let offsetX = 8;
    if (tooltip.x + offsetX + w > rightLimit) {
      // Try left side
      offsetX = -w - 8;
      if (tooltip.x + offsetX < leftLimit) {
        // Clamp within bounds if still overflowing
        offsetX = Math.min(Math.max(leftLimit - tooltip.x, -w / 2), rightLimit - tooltip.x - w);
      }
    }
    const offsetY = -h / 2;
    return (
      <g transform={`translate(${tooltip.x}, ${tooltip.y})`} pointerEvents="none">
        <rect x={offsetX} y={offsetY} rx={3} ry={3} width={w} height={h} fill="#111827" opacity={0.9} />
        <text x={offsetX + 4} y={offsetY + 11} fill="#fff" fontSize={9} fontFamily="system-ui, sans-serif">
          {displayedPrimary}
        </text>
        {tooltip.member.party?.label && (
          <text x={offsetX + 4} y={offsetY + 19} fill="#d1d5db" fontSize={7} fontFamily="system-ui, sans-serif">
            {displayedSecondary}
          </text>
        )}
      </g>
    );
  };

  return (
    <div ref={containerRef} className="w-full mx-auto">
      <div className="relative w-full" style={{ paddingBottom: `${aspectPaddingPercent}%` }}>
        <div className="absolute top-2 right-2 flex gap-2 z-20">
          <button type="button" className="btn btn-xs" onClick={downloadSVG} aria-label="Download SVG hemicycle">SVG</button>
          <button type="button" className="btn btn-xs" onClick={downloadPNG} aria-label="Download PNG hemicycle">PNG</button>
        </div>
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          role="img"
          aria-label={`Hemicycle showing ${visibleMembers.length} members`}
          preserveAspectRatio="xMidYMid meet"
          viewBox={`-${pad} -${pad} ${vbWidth} ${vbHeight}`}
        >
          {seats.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={(s.a ? s.a / 2.2 : 2.4) * seatScale}
              fill={s.member?.party?.color || '#808080'}
              stroke="#1f2937"
              strokeWidth={0.4 / seatScale}
              onMouseEnter={() => setTooltip({ x: s.x, y: s.y, member: s.member })}
              onMouseLeave={() => setTooltip(null)}
              onFocus={() => setTooltip({ x: s.x, y: s.y, member: s.member })}
              onBlur={() => setTooltip(null)}
              tabIndex={0}
            />
          ))}
          {renderTooltip()}
        </svg>
      </div>
    </div>
  );
};

export default HemicycleReact;
