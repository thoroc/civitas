import { collectGeneralElectionEvents } from './collectGeneralElectionEvents';
import { collectPartySwitchEvents } from './collectPartySwitchEvents';
import { collectSeatEvents } from './collectSeatEvents';
import { deduplicateEvents } from './deduplicateEvents';
import { GENERAL_ELECTIONS } from './electionsBaseline';
import { filterElectionsSince } from './filterElectionsSince';
import type { Event, HarvestConfig, NormalizedData } from './schemas';
import { sortEvents } from './sortEvents';

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
