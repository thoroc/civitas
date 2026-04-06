import { Command } from '@cliffy/command';

import { runTimeline } from './timeline.ts';
import type { TimelineOptions } from './timeline.ts';

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
