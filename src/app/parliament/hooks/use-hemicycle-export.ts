import { useCallback } from 'react';

import { exportHemicycle } from '../export-utils';

interface UseHemicycleExportOptions {
  getSvg: () => SVGSVGElement | null;
}

const useHemicycleExport = ({ getSvg }: UseHemicycleExportOptions) => {
  const downloadSVG = useCallback(() => {
    const svg = getSvg();
    if (!svg) return;
    exportHemicycle({ svg, format: 'svg', filename: 'hemicycle.svg' });
  }, [getSvg]);

  const downloadPNG = useCallback(() => {
    const svg = getSvg();
    if (!svg) return;
    exportHemicycle({
      svg,
      format: 'png',
      filename: 'hemicycle.png',
      scale: 3,
    });
  }, [getSvg]);

  return { downloadSVG, downloadPNG };
};

export default useHemicycleExport;
