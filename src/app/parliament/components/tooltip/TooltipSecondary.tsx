import React from 'react';

import {
  TOOLTIP_SECONDARY_TEXT_COLOR,
  TOOLTIP_FONT_FAMILY,
  TOOLTIP_SECONDARY_FONT_SIZE,
} from './tooltipTheme';

const TooltipSecondary: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
}> = ({ x, y, children }) => (
  <text
    x={x}
    y={y}
    fill={TOOLTIP_SECONDARY_TEXT_COLOR}
    fontSize={TOOLTIP_SECONDARY_FONT_SIZE}
    fontFamily={TOOLTIP_FONT_FAMILY}
  >
    {children}
  </text>
);

export default TooltipSecondary;
