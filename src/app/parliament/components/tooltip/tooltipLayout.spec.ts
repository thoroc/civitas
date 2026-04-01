import { describe, it, expect } from 'vitest';

import computeTooltipLayout from './tooltipLayout';
import { TOOLTIP_MIN_W, TOOLTIP_PARTY_FALLBACK_COLOR } from './tooltipTheme';

const makeMember = (label: string, partyLabel?: string, color?: string) =>
  ({
    label,
    party: partyLabel
      ? { label: partyLabel, color: color ?? '#123456' }
      : undefined,
  }) as any;

const baseInput = (overrides = {}) => ({
  tooltip: {
    x: 50,
    y: 30,
    i: 0,
    member: makeMember('Alice', 'Green', '#00FF00'),
  },
  pad: 10,
  vbWidth: 400,
  compact: false,
  ...overrides,
});

describe('computeTooltipLayout', () => {
  it('returns hasParty true when member has a party', () => {
    const result = computeTooltipLayout(baseInput());
    expect(result.hasParty).toBe(true);
  });

  it('returns hasParty false when member has no party', () => {
    const result = computeTooltipLayout({
      ...baseInput(),
      tooltip: { x: 50, y: 30, i: 0, member: makeMember('Bob') },
    });
    expect(result.hasParty).toBe(false);
  });

  it('width is at least TOOLTIP_MIN_W', () => {
    const result = computeTooltipLayout({
      ...baseInput(),
      tooltip: { x: 50, y: 30, i: 0, member: makeMember('A') },
    });
    expect(result.w).toBeGreaterThanOrEqual(TOOLTIP_MIN_W);
  });

  it('height is 30 for non-compact with party', () => {
    const result = computeTooltipLayout(baseInput());
    expect(result.h).toBe(30);
  });

  it('height is 22 for compact with party', () => {
    const result = computeTooltipLayout({ ...baseInput(), compact: true });
    expect(result.h).toBe(22);
  });

  it('height is 18 when no party', () => {
    const result = computeTooltipLayout({
      ...baseInput(),
      tooltip: { x: 50, y: 30, i: 0, member: makeMember('Bob') },
    });
    expect(result.h).toBe(18);
  });

  it('offsetY is -h/2', () => {
    const result = computeTooltipLayout(baseInput());
    expect(result.offsetY).toBe(-result.h / 2);
  });

  it('uses party color when provided', () => {
    const result = computeTooltipLayout(baseInput());
    expect(result.partyColor).toBe('#00FF00');
  });

  it('falls back to TOOLTIP_PARTY_FALLBACK_COLOR when no color on party', () => {
    const result = computeTooltipLayout({
      ...baseInput(),
      tooltip: {
        x: 50,
        y: 30,
        i: 0,
        member: { label: 'Carol', party: { label: 'Misc' } } as any,
      },
    });
    expect(result.partyColor).toBe(TOOLTIP_PARTY_FALLBACK_COLOR);
  });

  it('truncates long primary labels', () => {
    const longLabel = 'A'.repeat(60);
    const result = computeTooltipLayout({
      ...baseInput(),
      tooltip: { x: 50, y: 30, i: 0, member: makeMember(longLabel) },
    });
    expect(result.displayedPrimary.length).toBeLessThan(longLabel.length);
    expect(result.displayedPrimary.endsWith('…')).toBe(true);
  });

  it('does not flip tooltip off the left edge when near origin', () => {
    // seat at x=0, tooltip would normally go right — stay within bounds
    const result = computeTooltipLayout({
      ...baseInput(),
      tooltip: { x: 0, y: 0, i: 0, member: makeMember('Dave', 'Party') },
    });
    // offsetX should be positioned so tooltip stays within viewport
    expect(result.offsetX + result.w).toBeLessThanOrEqual(400 + 10 + 20); // rough bound
  });
});
