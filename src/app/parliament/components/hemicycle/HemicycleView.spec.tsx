// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import React, { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';

import HemicycleView from './HemicycleView';

const makeMember = (id: string) =>
  ({
    id,
    label: `Member ${id}`,
    constituency: null,
    party: { id: 'p1', label: 'Party A', color: '#ff0000' },
    gender: null,
    age: null,
  }) as any;

const makeSeat = (id: string, active = true) => ({
  x: 0,
  y: 0,
  a: 4,
  member: makeMember(id),
  active,
});

const baseProps = (overrides = {}) => ({
  containerRef: createRef<HTMLDivElement>(),
  svgRef: createRef<SVGSVGElement>(),
  pad: 10,
  vbWidth: 200,
  vbHeight: 100,
  seats: [makeSeat('1'), makeSeat('2')],
  seatScale: 1,
  members: [makeMember('1'), makeMember('2')],
  filteredMembers: [makeMember('1'), makeMember('2')],
  tooltip: null,
  compactTooltip: true,
  tooltipFade: false,
  focusIndex: 0,
  lockedIndex: null,
  liveMessage: '',
  downloadSVG: vi.fn(),
  downloadPNG: vi.fn(),
  onToggleCompact: vi.fn(),
  moveFocus: vi.fn(),
  moveVertical: vi.fn(() => 0),
  setFocusIndex: vi.fn(),
  setLockedIndex: vi.fn(),
  setTooltip: vi.fn(),
  setTooltipFade: vi.fn(),
  setLiveMessage: vi.fn(),
  ...overrides,
});

describe('HemicycleView', () => {
  it('renders data-testid=hemicycle container', () => {
    render(<HemicycleView {...baseProps()} />);
    expect(screen.getByTestId('hemicycle')).toBeTruthy();
  });

  it('renders SVG when members are present', () => {
    const { container } = render(<HemicycleView {...baseProps()} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('shows "No data" when members array is empty', () => {
    render(
      <HemicycleView
        {...baseProps({ members: [], filteredMembers: [], seats: [] })}
      />
    );
    expect(screen.getByText('No data')).toBeTruthy();
  });

  it('SVG aria-label reflects filtered vs total seat count', () => {
    const { container } = render(<HemicycleView {...baseProps()} />);
    const svg = container.querySelector('svg[aria-label]');
    expect(svg?.getAttribute('aria-label')).toContain('2 of 2 seats');
  });

  it('live region is rendered with aria-live polite', () => {
    const { container } = render(
      <HemicycleView {...baseProps({ liveMessage: 'Seat 1: Alice' })} />
    );
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toBeTruthy();
    expect(live?.textContent).toBe('Seat 1: Alice');
  });

  it('shows empty state overlay text when all seats filtered out', () => {
    const { container } = render(
      <HemicycleView {...baseProps({ filteredMembers: [] })} />
    );
    const svg = container.querySelector('svg');
    expect(svg?.textContent).toContain('No seats match current filters');
  });

  it('sr-only instructions element is present', () => {
    const { container } = render(<HemicycleView {...baseProps()} />);
    const instructions = container.querySelector('#hemicycle-instructions');
    expect(instructions).toBeTruthy();
  });
});
