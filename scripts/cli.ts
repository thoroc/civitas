#!/usr/bin/env bun
import { readFileSync } from 'node:fs';

import { Command } from '@cliffy/command';

import { partyMetaCommand } from './commands/party-meta.ts';
import { rangeCommand } from './commands/range.ts';
import { snapshotCommand } from './commands/snapshot.ts';
import { timelineCommand } from './commands/timeline.ts';

const { version } = JSON.parse(readFileSync('package.json', 'utf-8')) as {
  version: string;
};

await new Command()
  .name('generate')
  .version(version)
  .description('Civitas data generation CLI')
  .command('snapshot', snapshotCommand)
  .command('party-meta', partyMetaCommand)
  .command('timeline', timelineCommand)
  .command('range', rangeCommand)
  .parse(process.argv.slice(2));
