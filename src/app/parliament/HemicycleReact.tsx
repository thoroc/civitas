'use client';
/**
 * HemicycleReact (container)
 * Thin orchestration wrapper delegating state to useHemicycleState and
 * rendering via HemicycleView. Keeps this function body short to satisfy
 * lint max-lines threshold.
 */
import { HemicycleView } from './components/hemicycle';
import { useHemicycleState } from './hooks/useHemicycleState';
import { Leaning } from './hooks/usePartyMeta';
import { Member } from './types';

interface HemicycleReactProps {
  members: Member[];
  partyMetaOverride?: Record<string, { leaning: Leaning }>;
}

const HemicycleReact = ({
  members,
  partyMetaOverride,
}: HemicycleReactProps) => {
  const state = useHemicycleState({ members, partyMetaOverride });

  return (
    <HemicycleView
      containerRef={state.containerRef}
      svgRef={state.svgRef}
      pad={state.pad}
      vbWidth={state.vbWidth}
      vbHeight={state.vbHeight}
      seats={state.seats}
      seatScale={state.seatScale}
      members={state.members}
      filteredMembers={state.filteredMembers}
      tooltip={state.tooltip}
      compactTooltip={state.compactTooltip}
      tooltipFade={state.tooltipFade}
      focusIndex={state.focusIndex}
      lockedIndex={state.lockedIndex}
      liveMessage={state.liveMessage}
      downloadSVG={state.downloadSVG}
      downloadPNG={state.downloadPNG}
      onToggleCompact={state.toggleCompactTooltip}
      moveFocus={state.moveFocus}
      moveVertical={state.moveVertical}
      setFocusIndex={state.setFocusIndex}
      setLockedIndex={state.setLockedIndex}
      setTooltip={state.setTooltip}
      setTooltipFade={state.setTooltipFade}
      setLiveMessage={state.setLiveMessage}
    />
  );
};

export default HemicycleReact;
