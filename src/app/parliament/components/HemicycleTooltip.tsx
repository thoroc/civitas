import React from 'react';

import { Member } from '../types';

import { computeTooltipLayout } from './tooltipLayout';

export interface HemicycleTooltipProps {
  tooltip: { x: number; y: number; i: number; member: Member } | null;
  pad: number;
  vbWidth: number;
  compact: boolean;
  fade: boolean;
}

// Pure presentational tooltip extracted from HemicycleReact
const TooltipContent: React.FC<{
  layout: ReturnType<typeof computeTooltipLayout>;
  compact: boolean;
  fade: boolean;
  seatIndex: number;
  origin: { x: number; y: number };
}> = ({ layout, compact, fade, seatIndex, origin }) => {
  const {
    w,
    h,
    offsetX,
    offsetY,
    displayedPrimary,
    displayedSecondary,
    hasParty,
    partyColor,
  } = layout;
  const bgColor = '#1F3A60';
  const secondaryTextColor = '#E5E9EF';
  return (
    <g
      transform={`translate(${origin.x}, ${origin.y})`}
      pointerEvents='none'
      className={
        fade
          ? 'opacity-100 transition-opacity duration-100'
          : 'opacity-0 transition-opacity duration-100'
      }
    >
      <rect
        x={offsetX}
        y={offsetY}
        rx={4}
        ry={4}
        width={w}
        height={h}
        fill={bgColor}
        opacity={0.95}
        stroke={partyColor}
        strokeWidth={0.6}
      />
      <text
        x={offsetX + 6}
        y={offsetY + 12}
        fill='#FFFFFF'
        fontSize={9}
        fontFamily='system-ui, sans-serif'
        fontWeight={600}
      >
        {displayedPrimary}
      </text>
      {hasParty && (
        <text
          x={offsetX + 6}
          y={offsetY + (compact ? 20 : 22)}
          fill={secondaryTextColor}
          fontSize={7}
          fontFamily='system-ui, sans-serif'
        >
          {displayedSecondary}
        </text>
      )}
      {!compact && (
        <text
          x={offsetX + 6}
          y={offsetY + h - 5}
          fill={secondaryTextColor}
          fontSize={6}
          fontFamily='system-ui, sans-serif'
          letterSpacing={0.5}
        >
          Seat {seatIndex + 1}
        </text>
      )}
    </g>
  );
};

const HemicycleTooltip: React.FC<HemicycleTooltipProps> = ({
  tooltip,
  pad,
  vbWidth,
  compact,
  fade,
}) => {
  if (!tooltip) return null;
  const layout = computeTooltipLayout({ tooltip, pad, vbWidth, compact });
  return (
    <TooltipContent
      layout={layout}
      compact={compact}
      fade={fade}
      seatIndex={tooltip.i}
      origin={{ x: tooltip.x, y: tooltip.y }}
    />
  );
};

export default HemicycleTooltip;
