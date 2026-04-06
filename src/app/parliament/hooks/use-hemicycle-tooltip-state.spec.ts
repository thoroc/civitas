// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useHemicycleTooltipState } from './use-hemicycle-tooltip-state';

describe('useHemicycleTooltipState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes tooltip as null and tooltipFade as false', () => {
    const { result } = renderHook(() => useHemicycleTooltipState());
    expect(result.current.tooltip).toBeNull();
    expect(result.current.tooltipFade).toBe(false);
  });

  it('defaults compactTooltip to true when no localStorage entry', () => {
    const { result } = renderHook(() => useHemicycleTooltipState());
    expect(result.current.compactTooltip).toBe(true);
  });

  it('reads compactTooltip as false when localStorage is "full"', () => {
    localStorage.setItem('parliamentTooltipMode', 'full');
    const { result } = renderHook(() => useHemicycleTooltipState());
    expect(result.current.compactTooltip).toBe(false);
  });

  it('reads compactTooltip as true when localStorage is "compact"', () => {
    localStorage.setItem('parliamentTooltipMode', 'compact');
    const { result } = renderHook(() => useHemicycleTooltipState());
    expect(result.current.compactTooltip).toBe(true);
  });

  it('toggleCompactTooltip toggles the compact state', () => {
    const { result } = renderHook(() => useHemicycleTooltipState());
    expect(result.current.compactTooltip).toBe(true);
    act(() => {
      result.current.toggleCompactTooltip();
    });
    expect(result.current.compactTooltip).toBe(false);
    act(() => {
      result.current.toggleCompactTooltip();
    });
    expect(result.current.compactTooltip).toBe(true);
  });

  it('toggleCompactTooltip persists to localStorage', () => {
    const { result } = renderHook(() => useHemicycleTooltipState());
    act(() => {
      result.current.toggleCompactTooltip();
    });
    expect(localStorage.getItem('parliamentTooltipMode')).toBe('full');
    act(() => {
      result.current.toggleCompactTooltip();
    });
    expect(localStorage.getItem('parliamentTooltipMode')).toBe('compact');
  });

  it('setTooltip updates tooltip state', () => {
    const { result } = renderHook(() => useHemicycleTooltipState());
    const member = { label: 'Alice', party: null } as any;
    act(() => {
      result.current.setTooltip({ x: 10, y: 20, i: 3, member });
    });
    expect(result.current.tooltip).toEqual({ x: 10, y: 20, i: 3, member });
  });

  it('setTooltipFade updates fade state', () => {
    const { result } = renderHook(() => useHemicycleTooltipState());
    act(() => {
      result.current.setTooltipFade(true);
    });
    expect(result.current.tooltipFade).toBe(true);
  });
});
