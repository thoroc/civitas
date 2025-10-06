export interface HemicycleExportOptions {
  svg: SVGSVGElement;
  filename?: string; // infers default by format if omitted
  format: 'svg' | 'png';
  scale?: number; // png only
  background?: string; // png only
}

// Backwards-compatible specific option interfaces (kept for minimal diff imports)
interface ExportSvgOptions {
  svg: SVGSVGElement;
  filename?: string;
}
interface ExportPngOptions {
  svg: SVGSVGElement;
  filename?: string;
  scale?: number;
  background?: string;
}

export const exportHemicycle = (opts: HemicycleExportOptions) => {
  const { svg, format, filename, scale = 3, background = '#ffffff' } = opts;
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svg);
  if (!source.match(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/)) {
    source = source.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (format === 'svg') {
    const file = filename || 'hemicycle.svg';
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  // PNG path
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const bbox = svg.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, bbox.width) * scale;
    canvas.height = Math.max(1, bbox.height) * scale;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(b => {
        if (!b) return;
        const pngUrl = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = filename || 'hemicycle.png';
        a.click();
        URL.revokeObjectURL(pngUrl);
      });
    }
    URL.revokeObjectURL(url);
  };
  img.src = url;
};

// Backwards-compatible wrappers
export const exportSvg = ({ svg, filename }: ExportSvgOptions) =>
  exportHemicycle({ svg, filename, format: 'svg' });

export const exportPng = ({
  svg,
  filename,
  scale = 3,
  background = '#ffffff',
}: ExportPngOptions) =>
  exportHemicycle({ svg, filename, format: 'png', scale, background });
