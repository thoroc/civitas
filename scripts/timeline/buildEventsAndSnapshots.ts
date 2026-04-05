import { buildEvents } from '../harvest/buildEvents.ts';
import { buildSnapshots } from '../harvest/buildSnapshots.ts';
import { fetchWikidataEventTypeLookup } from '../harvest/eventType.ts';
import type { NormalizedData } from '../harvest/schemas.ts';
import {
  type Event,
  EventSchema,
  type HarvestConfig,
  type Snapshot,
  SnapshotSchema,
} from '../harvest/schemas.ts';
import { mergeWikidataEvents } from './mergeWikidataEvents.ts';

type Pipeline = { events: Event[]; snapshots: Snapshot[] };

export const buildEventsAndSnapshots = async (
  normalized: NormalizedData,
  cfg: HarvestConfig
): Promise<Pipeline> => {
  const events = buildEvents(normalized, cfg);
  try {
    // biome-ignore lint/complexity/noForEach: forEach used intentionally in try/catch validation block
    events.forEach(ev => EventSchema.parse(ev));
  } catch (e) {
    console.error('[official] Event validation error', (e as Error).message);
  }
  console.log(`[official] Events count=${events.length}`);

  const monthly = cfg.granularity !== 'events';
  const eventTypeLookup = await fetchWikidataEventTypeLookup();
  mergeWikidataEvents(events, eventTypeLookup, cfg.since);

  const snapshots = buildSnapshots(normalized, events, {
    monthly,
    eventTypeLookup,
  });
  try {
    // biome-ignore lint/complexity/noForEach: forEach used intentionally in try/catch validation block
    snapshots.forEach(sn => SnapshotSchema.parse(sn));
  } catch (e) {
    console.error('[official] Snapshot validation error', (e as Error).message);
  }
  console.log(`[official] Snapshots count=${snapshots.length}`);

  return { events, snapshots };
};
