// @vitest-environment jsdom
import { render } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';

import SeatCircles from './SeatCircles';

const makeSeat = (overrides = {}) => ({
  x: 10,
  y: 20,
  a: 5,
  member: { label: 'Alice', party: { color: '#ff0000' } } as any,
  active: true,
  ...overrides,
});

const renderInSvg = (props: React.ComponentProps<typeof SeatCircles>) => {
  const { container } = render(
    <svg>
      <SeatCircles {...props} />
    </svg>
  );
  return container.querySelector('svg')!;
};

describe('SeatCircles', () => {
  it('renders one circle when not locked', () => {
    const svg = renderInSvg({
      seat: makeSeat(),
      seatScale: 1,
      locked: false,
      inactive: false,
    });
    const circles = svg.querySelectorAll('circle');
    expect(circles).toHaveLength(1);
  });

  it('renders two circles when locked and active', () => {
    const svg = renderInSvg({
      seat: makeSeat(),
      seatScale: 1,
      locked: true,
      inactive: false,
    });
    const circles = svg.querySelectorAll('circle');
    expect(circles).toHaveLength(2);
  });

  it('does not render outer ring when locked but inactive', () => {
    const svg = renderInSvg({
      seat: makeSeat(),
      seatScale: 1,
      locked: true,
      inactive: true,
    });
    const circles = svg.querySelectorAll('circle');
    expect(circles).toHaveLength(1);
  });

  it('uses party color as fill', () => {
    const svg = renderInSvg({
      seat: makeSeat(),
      seatScale: 1,
      locked: false,
      inactive: false,
    });
    const circle = svg.querySelector('circle')!;
    expect(circle.getAttribute('fill')).toBe('#ff0000');
  });

  it('falls back to grey fill when no party color', () => {
    const svg = renderInSvg({
      seat: makeSeat({ member: { label: 'Bob', party: null } }),
      seatScale: 1,
      locked: false,
      inactive: false,
    });
    const circle = svg.querySelector('circle')!;
    expect(circle.getAttribute('fill')).toBe('#808080');
  });

  it('sets data-locked attribute when locked and active', () => {
    const svg = renderInSvg({
      seat: makeSeat(),
      seatScale: 1,
      locked: true,
      inactive: false,
    });
    const circles = svg.querySelectorAll('circle');
    // Inner seat circle (last) should have data-locked=true
    const innerCircle = circles[circles.length - 1];
    expect(innerCircle.getAttribute('data-locked')).toBe('true');
  });

  it('does not set data-locked when not locked', () => {
    const svg = renderInSvg({
      seat: makeSeat(),
      seatScale: 1,
      locked: false,
      inactive: false,
    });
    const circle = svg.querySelector('circle')!;
    expect(circle.getAttribute('data-locked')).toBeNull();
  });

  it('positions circle at seat coordinates', () => {
    const svg = renderInSvg({
      seat: makeSeat({ x: 42, y: 77 }),
      seatScale: 1,
      locked: false,
      inactive: false,
    });
    const circle = svg.querySelector('circle')!;
    expect(circle.getAttribute('cx')).toBe('42');
    expect(circle.getAttribute('cy')).toBe('77');
  });
});
