import { Command } from '@cliffy/command';

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
  const { events, snapshots } = buildEventsAndSnapshots(normalized, cfg);
  writeTimelineOutput(snapshots, events);
};

export const timelineCommand = new Command()
  .name('timeline')
  .description(
    'Generate official members timeline from Parliament Members API or OData'
  )
  .option('--since <date:string>', 'Start date', { default: '2005-01-01' })
  .option('--granularity <granularity:string>', 'events, monthly, or both', {
    default: 'monthly',
  })
  .option('--merge-labour-coop', 'Merge Labour and Co-op', { default: false })
  .option('--force-refresh', 'Force re-fetch cached member data', {
    default: false,
  })
  .option('--max-concurrency <n:number>', 'Max concurrent requests', {
    default: 6,
  })
  .option('--cache-dir <path:string>', 'Cache directory', {
    default: '.cache/members-api',
  })
  .option('--source <source:string>', 'membersApi or odata', {
    default: 'membersApi',
  })
  .action(async opts => {
    await runTimeline({
      since: opts.since,
      granularity: opts.granularity as TimelineOptions['granularity'],
      mergeLabourCoop: opts.mergeLabourCoop ?? false,
      forceRefresh: opts.forceRefresh ?? false,
      maxConcurrency: opts.maxConcurrency ?? 6,
      cacheDir: opts.cacheDir,
      source: opts.source as TimelineOptions['source'],
    });
  });
