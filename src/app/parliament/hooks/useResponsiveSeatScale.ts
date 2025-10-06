import { useEffect, useState, RefObject } from 'react';

/**
 * useResponsiveSeatScale
 * ----------------------
 * Observes container size and produces a clamped seat scale factor used to size/space
 * hemicycle seat circles. Encapsulates ResizeObserver setup/teardown.
 */
const useResponsiveSeatScale = (
  containerRef: RefObject<HTMLElement>,
  { min = 0.9, max = 3.4 } = {}
) => {
  const [seatScale, setSeatScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height || w / 2; // fallback heuristic
        const scale = Math.min(max, Math.max(min, Math.min(w / 360, h / 200)));
        setSeatScale(scale);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, min, max]);

  return seatScale;
};

export default useResponsiveSeatScale;
