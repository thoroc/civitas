#!/usr/bin/env bun
import { readFileSync } from 'node:fs';

import { Command } from '@cliffy/command';

const { version } = JSON.parse(readFileSync('package.json', 'utf-8')) as {
  version: string;
};

await new Command()
  .name('generate')
  .version(version)
  .description('Civitas data generation CLI')
  // subcommands registered in Wave 3
  .parse(process.argv.slice(2));
