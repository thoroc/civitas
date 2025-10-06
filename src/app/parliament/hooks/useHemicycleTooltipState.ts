import { useCallback, useState } from 'react';

import { Member } from '../types';

export interface TooltipState {
  x: number;
  y: number;
  i: number;
  member: Member;
}

export const useHemicycleTooltipState = () => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [tooltipFade, setTooltipFade] = useState(false);
  const [compactTooltip, setCompactTooltip] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem('parliamentTooltipMode') !== 'full';
    } catch {
      return true;
    }
  });

  const toggleCompactTooltip = useCallback(() => {
    setCompactTooltip(c => {
      const next = !c;
      try {
        localStorage.setItem(
          'parliamentTooltipMode',
          next ? 'compact' : 'full'
        );
      } catch {}
      return next;
    });
  }, []);

  return {
    tooltip,
    setTooltip,
    tooltipFade,
    setTooltipFade,
    compactTooltip,
    toggleCompactTooltip,
  };
};
