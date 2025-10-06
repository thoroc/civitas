import { Member } from '../types';

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
export const computeTooltipLayout = ({
  tooltip,
  pad,
  vbWidth,
  compact,
}: TooltipLayoutInput): TooltipLayoutResult => {
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
  const partyColor = tooltip.member.party?.color || '#6B7280';
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
