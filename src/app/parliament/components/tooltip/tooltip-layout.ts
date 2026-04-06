import type { Member } from '../../types';

import {
  TOOLTIP_APPROX_CHAR,
  TOOLTIP_MEASURE_PAD_PX,
  TOOLTIP_MIN_W,
  TOOLTIP_OFFSET_GUTTER,
  TOOLTIP_PARTY_FALLBACK_COLOR,
  TOOLTIP_SECONDARY_ADJ,
} from './tooltip-theme';

const APPROX_CHAR = TOOLTIP_APPROX_CHAR;
const SECONDARY_ADJ = TOOLTIP_SECONDARY_ADJ;
const MIN_W = TOOLTIP_MIN_W;

export interface RawTooltipData {
  x: number;
  y: number;
  i: number;
  member: Member;
}

export interface TooltipLayoutInput {
  tooltip: RawTooltipData;
  pad: number;
  vbWidth: number;
  compact: boolean;
}

export interface TooltipLayoutResult {
  w: number;
  h: number;
  offsetX: number;
  offsetY: number;
  displayedPrimary: string;
  displayedSecondary: string;
  hasParty: boolean;
  partyColor: string;
}

/**
 * Computes tooltip geometry + truncated labels deterministically so the rendering
 * component stays presentational and small.
 */

interface MeasureWidthOptions {
  label: string;
  perChar: number;
  padPx?: number;
}
const measureWidth = ({
  label,
  perChar,
  padPx = TOOLTIP_MEASURE_PAD_PX,
}: MeasureWidthOptions) => label.length * perChar + padPx;

const truncate = (label: string, capacity: number) =>
  label.length > capacity
    ? `${label.slice(0, Math.max(0, capacity - 1))}…`
    : label;

interface HorizontalOffsetOptions {
  seatX: number;
  w: number;
  leftLimit: number;
  rightLimit: number;
}
const computeHorizontalOffset = ({
  seatX,
  w,
  leftLimit,
  rightLimit,
}: HorizontalOffsetOptions) => {
  let offsetX = TOOLTIP_OFFSET_GUTTER;
  if (seatX + offsetX + w > rightLimit) {
    offsetX = -w - TOOLTIP_OFFSET_GUTTER;
    if (seatX + offsetX < leftLimit) {
      offsetX = Math.min(
        Math.max(leftLimit - seatX, -w / 2),
        rightLimit - seatX - w
      );
    }
  }
  return offsetX;
};

const computeTooltipLayout = ({
  tooltip,
  pad,
  vbWidth,
  compact,
}: TooltipLayoutInput): TooltipLayoutResult => {
  const hasParty = Boolean(tooltip.member.party?.label);
  const maxW = vbWidth * 0.24;
  const primaryLabel = tooltip.member.label;
  const secondaryLabel = tooltip.member.party?.label ?? '';

  const desiredPrimary = measureWidth({
    label: primaryLabel,
    perChar: APPROX_CHAR,
  });
  const desiredSecondary = hasParty
    ? measureWidth({
        label: secondaryLabel,
        perChar: APPROX_CHAR - SECONDARY_ADJ,
      })
    : 0;
  const w = Math.min(maxW, Math.max(MIN_W, desiredPrimary, desiredSecondary));

  const h = hasParty && !compact ? 30 : hasParty ? 22 : 18;

  const capacityPrimary = Math.floor((w - 8) / APPROX_CHAR);
  const displayedPrimary = truncate(primaryLabel, capacityPrimary);
  const capacitySecondary = hasParty
    ? Math.floor((w - 8) / (APPROX_CHAR - SECONDARY_ADJ))
    : 0;
  const displayedSecondary = hasParty
    ? truncate(secondaryLabel, capacitySecondary)
    : secondaryLabel;

  const leftLimit = -pad;
  const rightLimit = -pad + vbWidth;
  const offsetX = computeHorizontalOffset({
    seatX: tooltip.x,
    w,
    leftLimit,
    rightLimit,
  });
  const offsetY = -h / 2;
  const partyColor =
    tooltip.member.party?.color || TOOLTIP_PARTY_FALLBACK_COLOR;
  return {
    w,
    h,
    offsetX,
    offsetY,
    displayedPrimary,
    displayedSecondary,
    hasParty,
    partyColor,
  };
};

export default computeTooltipLayout;
