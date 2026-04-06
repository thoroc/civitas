import { collectGeneralElectionEvents } from './collect-general-election-events';
import { collectPartySwitchEvents } from './collect-party-switch-events';
import { collectSeatEvents } from './collect-seat-events';
import { deduplicateEvents } from './deduplicate-events';
import { GENERAL_ELECTIONS } from './elections-baseline';
import { filterElectionsSince } from './filter-elections-since';
import type { Event, HarvestConfig, NormalizedData } from './schemas';
import { sortEvents } from './sort-events';

interface BuildEventsOptions {
  elections?: { date: string; label: string }[];
}

export const buildEvents = (
  normalized: NormalizedData,
  cfg: HarvestConfig,
  opts: BuildEventsOptions = {}
): Event[] => {
  const elections = filterElectionsSince(
    opts.elections || GENERAL_ELECTIONS,
    cfg.since
  );
  const generalElectionSet = new Set(elections.map(e => e.date));

  const events = [
    ...collectGeneralElectionEvents(elections),
    ...collectSeatEvents({
      seatSpells: normalized.seatSpells,
      since: cfg.since,
      generalElectionSet,
    }),
    ...collectPartySwitchEvents({
      partySpells: normalized.partySpells,
      since: cfg.since,
      generalElectionSet,
    }),
  ];

  return sortEvents(deduplicateEvents(events));
};
