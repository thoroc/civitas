import React from 'react';

import { Member } from '../types';

export interface HemicycleTooltipProps {
  tooltip: { x: number; y: number; i: number; member: Member } | null;
  pad: number;
  vbWidth: number;
  compact: boolean;
  fade: boolean;
}

// Pure presentational tooltip extracted from HemicycleReact
const HemicycleTooltip: React.FC<HemicycleTooltipProps> = ({
  tooltip,
  pad,
  vbWidth,
  compact,
  fade,
}) => {
  if (!tooltip) return null;
  const hasParty = Boolean(tooltip.member.party?.label);
  const maxW = vbWidth * 0.24;
  const primaryLabel = tooltip.member.label;
  const secondaryLabel = hasParty ? tooltip.member.party!.label : '';
  const approxChar = 5;
  const desiredPrimary = primaryLabel.length * approxChar + 10;
  const desiredSecondary = hasParty
    ? secondaryLabel.length * (approxChar - 0.8) + 10
    : 0;
  const w = Math.min(maxW, Math.max(42, desiredPrimary, desiredSecondary));
  const h = hasParty && !compact ? 30 : hasParty ? 22 : 18;
  const capacityPrimary = Math.floor((w - 8) / approxChar);
  const displayedPrimary =
    primaryLabel.length > capacityPrimary
      ? primaryLabel.slice(0, Math.max(0, capacityPrimary - 1)) + '…'
      : primaryLabel;
  const capacitySecondary = hasParty
    ? Math.floor((w - 8) / (approxChar - 0.8))
    : 0;
  const displayedSecondary =
    hasParty && secondaryLabel.length > capacitySecondary
      ? secondaryLabel.slice(0, Math.max(0, capacitySecondary - 1)) + '…'
      : secondaryLabel;
  const leftLimit = -pad;
  const rightLimit = -pad + vbWidth;
  let offsetX = 10;
  if (tooltip.x + offsetX + w > rightLimit) {
    offsetX = -w - 10;
    if (tooltip.x + offsetX < leftLimit) {
      offsetX = Math.min(
        Math.max(leftLimit - tooltip.x, -w / 2),
        rightLimit - tooltip.x - w
      );
    }
  }
  const offsetY = -h / 2;
  const bgColor = '#1F3A60';
  const secondaryTextColor = '#E5E9EF';
  const partyColor = tooltip.member.party?.color || '#6B7280';

  return (
    <g
      transform={`translate(${tooltip.x}, ${tooltip.y})`}
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
          Seat {tooltip.i + 1}
        </text>
      )}
    </g>
  );
};

export default HemicycleTooltip;
