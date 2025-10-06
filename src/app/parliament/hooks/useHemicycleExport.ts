import { useCallback } from 'react';

import { exportSvg, exportPng } from '../exportUtils';

interface UseHemicycleExportOptions {
  getSvg: () => SVGSVGElement | null;
}

const useHemicycleExport = ({ getSvg }: UseHemicycleExportOptions) => {
  const downloadSVG = useCallback(() => {
    const svg = getSvg();
    if (!svg) return;
    exportSvg({ svg, filename: 'hemicycle.svg' });
  }, [getSvg]);

  const downloadPNG = useCallback(() => {
    const svg = getSvg();
    if (!svg) return;
    exportPng({ svg, filename: 'hemicycle.png', scale: 3 });
  }, [getSvg]);

  return { downloadSVG, downloadPNG };
};

export default useHemicycleExport;
