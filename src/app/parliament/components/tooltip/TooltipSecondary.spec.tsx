// @vitest-environment jsdom
import { render } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it } from 'vitest';

import TooltipSecondary from './TooltipSecondary';
import {
  TOOLTIP_FONT_FAMILY,
  TOOLTIP_SECONDARY_FONT_SIZE,
  TOOLTIP_SECONDARY_TEXT_COLOR,
} from './tooltipTheme';

const renderInSvg = (props: React.ComponentProps<typeof TooltipSecondary>) => {
  const { container } = render(
    <svg>
      <TooltipSecondary {...props} />
    </svg>
  );
  return container.querySelector('svg')!;
};

describe('TooltipSecondary', () => {
  it('renders a text element', () => {
    const svg = renderInSvg({ x: 5, y: 10, children: 'Green Party' });
    expect(svg.querySelector('text')).toBeTruthy();
  });

  it('renders children text', () => {
    const svg = renderInSvg({ x: 0, y: 0, children: 'Liberal' });
    expect(svg.querySelector('text')?.textContent).toBe('Liberal');
  });

  it('sets x and y attributes', () => {
    const svg = renderInSvg({ x: 12, y: 34, children: 'Party' });
    const text = svg.querySelector('text')!;
    expect(text.getAttribute('x')).toBe('12');
    expect(text.getAttribute('y')).toBe('34');
  });

  it('applies theme fill color', () => {
    const svg = renderInSvg({ x: 0, y: 0, children: 'X' });
    const text = svg.querySelector('text')!;
    expect(text.getAttribute('fill')).toBe(TOOLTIP_SECONDARY_TEXT_COLOR);
  });

  it('applies theme font family', () => {
    const svg = renderInSvg({ x: 0, y: 0, children: 'X' });
    const text = svg.querySelector('text')!;
    expect(text.getAttribute('font-family')).toBe(TOOLTIP_FONT_FAMILY);
  });

  it('applies theme font size', () => {
    const svg = renderInSvg({ x: 0, y: 0, children: 'X' });
    const text = svg.querySelector('text')!;
    expect(text.getAttribute('font-size')).toBe(
      String(TOOLTIP_SECONDARY_FONT_SIZE)
    );
  });
});
