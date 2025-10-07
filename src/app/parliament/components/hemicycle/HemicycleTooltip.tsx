import React from 'react';

import { Member } from '../../types';

import { computeTooltipLayout } from './tooltipLayout';
import TooltipSecondary from './TooltipSecondary';
import {
  TOOLTIP_BG_COLOR,
  TOOLTIP_SECONDARY_TEXT_COLOR,
  TOOLTIP_OPACITY,
  TOOLTIP_RX,
  TOOLTIP_RY,
  TOOLTIP_STROKE_WIDTH,
  TOOLTIP_FONT_FAMILY,
  TOOLTIP_PRIMARY_FONT_SIZE,
  TOOLTIP_SEAT_FONT_SIZE,
  TOOLTIP_SEAT_LETTER_SPACING,
} from './tooltipTheme';

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

  const bgColor = TOOLTIP_BG_COLOR;
  const secondaryTextColor = TOOLTIP_SECONDARY_TEXT_COLOR;

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
        rx={TOOLTIP_RX}
        ry={TOOLTIP_RY}
        width={w}
        height={h}
        fill={bgColor}
        opacity={TOOLTIP_OPACITY}
        stroke={partyColor}
        strokeWidth={TOOLTIP_STROKE_WIDTH}
      />

      <text
        x={offsetX + 6}
        y={offsetY + 12}
        fill='#FFFFFF'
        fontSize={TOOLTIP_PRIMARY_FONT_SIZE}
        fontFamily={TOOLTIP_FONT_FAMILY}
        fontWeight={600}
      >
        {displayedPrimary}
      </text>

      {hasParty && (
        <TooltipSecondary x={offsetX + 6} y={offsetY + (compact ? 20 : 22)}>
          {displayedSecondary}
        </TooltipSecondary>
      )}

      {!compact && (
        <text
          x={offsetX + 6}
          y={offsetY + h - 5}
          fill={secondaryTextColor}
          fontSize={TOOLTIP_SEAT_FONT_SIZE}
          fontFamily={TOOLTIP_FONT_FAMILY}
          letterSpacing={TOOLTIP_SEAT_LETTER_SPACING}
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
