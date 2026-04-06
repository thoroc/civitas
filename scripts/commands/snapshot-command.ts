import { Command } from '@cliffy/command';

import { runSnapshot } from './snapshot.ts';

export const snapshotCommand = new Command()
  .name('snapshot')
  .description('Fetch a parliament snapshot for a given date from Wikidata')
  .option('--date <date:string>', 'ISO date (e.g. 2021-01-01T00:00:00Z)', {
    required: true,
  })
  .option('--merge-labour-coop', 'Merge Labour and Co-op into one party', {
    default: false,
  })
  .action(async opts => {
    await runSnapshot({
      date: opts.date,
      mergeLabourCoop: opts.mergeLabourCoop ?? false,
    });
  });
