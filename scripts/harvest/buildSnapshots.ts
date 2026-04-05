import { applyEventToState } from './buildSnapshots/applyEventToState.ts';
import { buildSnapshot } from './buildSnapshots/buildSnapshot.ts';
import { createInitialState } from './buildSnapshots/createInitialState.ts';
import { createSnapshotSourceHashes } from './buildSnapshots/createSnapshotSourceHashes.ts';
import type { EventTypeLookup } from './eventType.ts';
import type { Event, NormalizedData, Snapshot } from './schemas.ts';

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
