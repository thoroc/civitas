import { Command } from '@cliffy/command';

import { runPartyMeta } from './party-meta.ts';

export const partyMetaCommand = new Command()
  .name('party-meta')
  .description(
    'Generate party metadata (ideological leaning) from a parliament snapshot'
  )
  .option(
    '--snapshot <path:string>',
    'Path to an existing parliament snapshot JSON',
    { required: true }
  )
  .action(async opts => {
    await runPartyMeta({ snapshot: opts.snapshot });
  });
