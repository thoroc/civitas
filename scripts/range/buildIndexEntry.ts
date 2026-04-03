import fs from 'node:fs';
import path from 'node:path';

import { OUTPUT_DIR } from '../lib/paths.ts';

export type IndexEntry = {
  date: string;
  safeDate: string;
  file: string;
  partyMetaFile: string | null;
  total: number;
  generatedAt: string;
};

export const buildIndexEntry = (
  snapshotFile: string,
  date: string,
  safeDate: string
): IndexEntry => {
  const snap = JSON.parse(fs.readFileSync(snapshotFile, 'utf-8'));
  const partyMetaPath = path.join(OUTPUT_DIR, `partyMeta-${safeDate}.json`);
  return {
    date: snap.meta?.date || date,
    safeDate,
    file: `parliament-${safeDate}.json`,
    partyMetaFile: fs.existsSync(partyMetaPath)
      ? `partyMeta-${safeDate}.json`
      : null,
    total: snap.meta?.total || snap.members?.length || 0,
    generatedAt:
      snap.meta?.generatedAt || fs.statSync(snapshotFile).mtime.toISOString(),
  };
};
