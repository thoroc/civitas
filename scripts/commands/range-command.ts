import { Command } from '@cliffy/command';

import { runRange } from './range.ts';

export const rangeCommand = new Command()
  .description(
    'Generate parliament snapshots for all UK Parliament term start dates'
  )
  .option('--mode <mode:string>', 'Discovery mode (only "terms" supported)', {
    required: true,
  })
  .option('--throttle <ms:number>', 'Milliseconds between requests', {
    default: 300,
  })
  .option('--force', 'Overwrite existing snapshots')
  .action(async opts => {
    if (opts.mode !== 'terms') {
      console.error('Only --mode terms is supported');
      process.exit(1);
    }
    await runRange({
      mode: 'terms',
      throttle: opts.throttle,
      force: opts.force ?? false,
    });
  });
