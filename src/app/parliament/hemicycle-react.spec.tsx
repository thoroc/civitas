// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import HemicycleReact from './hemicycle-react';
import { ParliamentFiltersProvider } from './context/filters-context';

vi.mock('./exportUtils', () => ({ exportHemicycle: vi.fn() }));

// jsdom has no ResizeObserver — provide a no-op stub
beforeAll(() => {
  if (!global.ResizeObserver) {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

const makeMember = (id: string) =>
  ({
    id,
    label: `Member ${id}`,
    constituency: null,
    party: { id: 'p1', label: 'Party A', color: '#336699' },
    gender: null,
    age: null,
  }) as any;

const renderWithProvider = (members: any[], partyMetaOverride = {}) =>
  render(
    <ParliamentFiltersProvider>
      <HemicycleReact members={members} partyMetaOverride={partyMetaOverride} />
    </ParliamentFiltersProvider>
  );

describe('HemicycleReact', () => {
  it('renders the hemicycle container', () => {
    renderWithProvider([makeMember('1'), makeMember('2')]);
    expect(screen.getByTestId('hemicycle')).toBeTruthy();
  });

  it('renders an SVG when members are present', () => {
    const { container } = renderWithProvider([
      makeMember('1'),
      makeMember('2'),
      makeMember('3'),
    ]);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('shows "No data" when members array is empty', () => {
    renderWithProvider([]);
    expect(screen.getByText('No data')).toBeTruthy();
  });

  it('SVG aria-label references the member count', () => {
    const { container } = renderWithProvider([
      makeMember('1'),
      makeMember('2'),
    ]);
    const svg = container.querySelector('svg[aria-label]');
    expect(svg?.getAttribute('aria-label')).toMatch(/2.*seats/i);
  });
});
