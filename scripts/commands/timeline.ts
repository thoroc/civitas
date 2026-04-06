import { runHarvest } from '../harvest/runHarvest.ts';
import type { HarvestConfig } from '../harvest/schemas.ts';
import { HarvestConfigSchema } from '../harvest/schemas.ts';
import { buildEventsAndSnapshots } from '../timeline/buildEventsAndSnapshots.ts';
import { reportValidation } from '../timeline/reportValidation.ts';
import { validateSpells } from '../timeline/validation.ts';
import { writeTimelineOutput } from '../timeline/writeTimelineOutput.ts';

export type TimelineOptions = {
  since: string;
  granularity: 'events' | 'monthly' | 'both';
  mergeLabourCoop: boolean;
  forceRefresh: boolean;
  maxConcurrency: number;
  cacheDir: string;
  source: 'membersApi' | 'odata';
};

export const runTimeline = async (opts: TimelineOptions): Promise<void> => {
  const cfg: HarvestConfig = {
    since: opts.since,
    granularity: opts.granularity,
    cacheDir: opts.cacheDir,
    mergeLabourCoop: opts.mergeLabourCoop,
    maxConcurrency: opts.maxConcurrency,
    forceRefresh: opts.forceRefresh,
    partyAliases: {},
    source: opts.source,
  };
  try {
    HarvestConfigSchema.parse(cfg);
  } catch (e) {
    console.error('[official] Invalid config', (e as Error).message);
    process.exit(1);
  }
  console.log(
    `[official] Harvest starting since=${opts.since} granularity=${opts.granularity} source=${opts.source}`
  );
  const normalized = await runHarvest(cfg);
  reportValidation(
    validateSpells(normalized.partySpells),
    validateSpells(normalized.seatSpells)
  );
  const { events, snapshots } = await buildEventsAndSnapshots(normalized, cfg);
  writeTimelineOutput(snapshots, events);
};
