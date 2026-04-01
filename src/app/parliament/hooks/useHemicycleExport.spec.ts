// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { exportHemicycle } from '../exportUtils';

import useHemicycleExport from './useHemicycleExport';

vi.mock('../exportUtils', () => ({
  exportHemicycle: vi.fn(),
}));

const mockExport = exportHemicycle as ReturnType<typeof vi.fn>;

const makeSvg = () =>
  document.createElementNS(
    'http://www.w3.org/2000/svg',
    'svg'
  ) as SVGSVGElement;

describe('useHemicycleExport', () => {
  beforeEach(() => {
    mockExport.mockClear();
  });

  it('downloadSVG calls exportHemicycle with svg format', () => {
    const svg = makeSvg();
    const { result } = renderHook(() =>
      useHemicycleExport({ getSvg: () => svg })
    );
    result.current.downloadSVG();
    expect(mockExport).toHaveBeenCalledWith({
      svg,
      format: 'svg',
      filename: 'hemicycle.svg',
    });
  });

  it('downloadSVG does nothing when getSvg returns null', () => {
    const { result } = renderHook(() =>
      useHemicycleExport({ getSvg: () => null })
    );
    result.current.downloadSVG();
    expect(mockExport).not.toHaveBeenCalled();
  });

  it('downloadPNG calls exportHemicycle with png format and scale 3', () => {
    const svg = makeSvg();
    const { result } = renderHook(() =>
      useHemicycleExport({ getSvg: () => svg })
    );
    result.current.downloadPNG();
    expect(mockExport).toHaveBeenCalledWith({
      svg,
      format: 'png',
      filename: 'hemicycle.png',
      scale: 3,
    });
  });

  it('downloadPNG does nothing when getSvg returns null', () => {
    const { result } = renderHook(() =>
      useHemicycleExport({ getSvg: () => null })
    );
    result.current.downloadPNG();
    expect(mockExport).not.toHaveBeenCalled();
  });
});
