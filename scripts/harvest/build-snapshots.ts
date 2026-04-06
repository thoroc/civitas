import { applyEventToState } from './build-snapshots/apply-event-to-state.ts';
import { buildSnapshot } from './build-snapshots/build-snapshot.ts';
import { createInitialState } from './build-snapshots/create-initial-state.ts';
import { createSnapshotSourceHashes } from './build-snapshots/create-snapshot-source-hashes.ts';
import type { EventTypeLookup } from './event-type.ts';
import type { Event, NormalizedData, Snapshot } from './schemas';

export interface BuildSnapshotsOptions {
  monthly?: boolean;
  eventTypeLookup?: EventTypeLookup;
}

export const buildSnapshots = (
  normalized: NormalizedData,
  events: Event[],
  opts: BuildSnapshotsOptions = {}
): Snapshot[] => {
  const firstDate = events.length ? events[0].date : undefined;
  const state = createInitialState(normalized, firstDate);
  const snapshots: Snapshot[] = [];
  const sourceHashes = createSnapshotSourceHashes(normalized.members, events);
  let currentMonth = firstDate ? firstDate.slice(0, 7) : undefined;

  for (const event of events) {
    applyEventToState(state, normalized, event);

    snapshots.push(
      buildSnapshot({
        date: event.date,
        normalized,
        state,
        sourceHashes,
        eventTypeLookup: opts.eventTypeLookup,
      })
    );

    if (opts.monthly) {
      const month = event.date.slice(0, 7);
      if (month !== currentMonth) {
        currentMonth = month;
        snapshots.push(
          buildSnapshot({
            date: `${month}-01`,
            normalized,
            state,
            sourceHashes,
            eventTypeLookup: opts.eventTypeLookup,
          })
        );
      }
    }
  }

  return snapshots;
};
