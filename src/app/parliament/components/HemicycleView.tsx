import { Dispatch, SetStateAction } from 'react';

import { HemicycleLayoutResult } from '../hooks/useHemicycleLayout';
import { Member } from '../types';

import HemicycleExportBar from './HemicycleExportBar';
import HemicycleSeats from './HemicycleSeats';
import HemicycleTooltip from './HemicycleTooltip';

interface HemicycleViewProps {
  containerRef: React.RefObject<HTMLDivElement>;
  svgRef: React.RefObject<SVGSVGElement>;
  pad: number;
  vbWidth: number;
  vbHeight: number;
  seats: HemicycleLayoutResult['seats'];
  seatScale: number;
  members: Member[];
  filteredMembers: Member[];
  tooltip: { x: number; y: number; i: number; member: Member } | null;
  compactTooltip: boolean;
  tooltipFade: boolean;
  focusIndex: number;
  lockedIndex: number | null;
  liveMessage: string;
  downloadSVG: () => void;
  downloadPNG: () => void;
  onToggleCompact: () => void;
  moveFocus: (targetIndex: number, direction?: 1 | -1) => void;
  moveVertical: (current: number, direction: 1 | -1) => number;
  setFocusIndex: Dispatch<SetStateAction<number>>;
  setLockedIndex: Dispatch<SetStateAction<number | null>>;
  setTooltip: Dispatch<
    SetStateAction<{ x: number; y: number; i: number; member: Member } | null>
  >;
  setTooltipFade: Dispatch<SetStateAction<boolean>>;
  setLiveMessage: Dispatch<SetStateAction<string>>;
}

const HemicycleView = ({
  containerRef,
  svgRef,
  pad,
  vbWidth,
  vbHeight,
  seats,
  seatScale,
  members,
  filteredMembers,
  tooltip,
  compactTooltip,
  tooltipFade,
  focusIndex,
  lockedIndex,
  liveMessage,
  downloadSVG,
  downloadPNG,
  onToggleCompact,
  moveFocus,
  moveVertical,
  setFocusIndex,
  setLockedIndex,
  setTooltip,
  setTooltipFade,
  setLiveMessage,
}: HemicycleViewProps) => {
  const hasData = members.length > 0;
  return (
    <div ref={containerRef} className='w-full mx-auto'>
      <div className='relative w-full aspect-[2/1]'>
        <HemicycleExportBar
          compact={compactTooltip}
          onToggleCompact={onToggleCompact}
          onDownloadSVG={downloadSVG}
          onDownloadPNG={downloadPNG}
        />
        <div id='hemicycle-instructions' className='sr-only'>
          Interactive hemicycle: Use Arrow keys to move between seats. Home and
          End jump to first or last seat. Page Up and Page Down move by ten
          seats. Press Enter to repeat the current seat announcement.
        </div>
        {hasData ? (
          <>
            <svg
              ref={svgRef}
              className='absolute inset-0 w-full h-full'
              role='group'
              aria-label={`Hemicycle: ${filteredMembers.length} of ${members.length} seats match current filters`}
              aria-describedby='hemicycle-instructions'
              preserveAspectRatio='xMidYMid meet'
              viewBox={`-${pad} -${pad} ${vbWidth} ${vbHeight}`}
            >
              <HemicycleSeats
                seats={seats}
                seatScale={seatScale}
                focusIndex={focusIndex}
                lockedIndex={lockedIndex}
                tooltip={tooltip}
                moveFocus={moveFocus}
                moveVertical={moveVertical}
                setFocusIndex={setFocusIndex}
                setLockedIndex={setLockedIndex}
                setTooltip={setTooltip}
                setTooltipFade={setTooltipFade}
                setLiveMessage={setLiveMessage}
              />
              <HemicycleTooltip
                tooltip={tooltip}
                pad={pad}
                vbWidth={vbWidth}
                compact={compactTooltip}
                fade={tooltipFade}
              />
              {filteredMembers.length === 0 && (
                <g aria-hidden='true'>
                  <rect
                    x={-pad}
                    y={-pad}
                    width={vbWidth}
                    height={vbHeight}
                    fill='white'
                    opacity={0.6}
                  />
                  <text
                    x={vbWidth / 2 - pad}
                    y={vbHeight / 2 - pad}
                    textAnchor='middle'
                    fill='#374151'
                    fontSize={10}
                    fontFamily='system-ui, sans-serif'
                    fontWeight={600}
                  >
                    No seats match current filters
                  </text>
                </g>
              )}
            </svg>
            <div className='sr-only' aria-live='polite' aria-atomic='true'>
              {liveMessage}
            </div>
          </>
        ) : (
          <div className='p-4 text-sm'>No data</div>
        )}
      </div>
    </div>
  );
};

export default HemicycleView;
