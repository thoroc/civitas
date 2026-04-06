import fs from 'node:fs';

import type { Snapshot } from './types.ts';

export const loadSnapshot = (file: string): Snapshot => {
  if (!fs.existsSync(file)) {
    console.error(`Snapshot not found: ${file}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as Snapshot;
};
