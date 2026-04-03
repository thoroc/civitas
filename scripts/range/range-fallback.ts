import fs from 'node:fs';
import path from 'node:path';

import { runPartyMeta } from '../commands/party-meta.ts';
import { normalizeInputDate } from '../lib/normalizeInputDate.ts';
import { OUTPUT_DIR, PARLIAMENT_INDEX } from '../lib/paths.ts';
import { buildIndexEntry } from './buildIndexEntry.ts';
import type { IndexEntry } from './buildIndexEntry.ts';

export const handleFallbackRange = async (
  indexByDate: Map<string, IndexEntry>
): Promise<void> => {
  const files = fs
    .readdirSync(OUTPUT_DIR)
    .filter(f =>
      /^parliament-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/.test(f)
    );
  if (!files.length) {
    console.warn(
      'No existing parliament-* snapshot files found. Writing empty index.'
    );
    fs.writeFileSync(PARLIAMENT_INDEX, JSON.stringify([], null, 2));
    console.log(`Index written: ${PARLIAMENT_INDEX}`);
    return;
  }
  for (const f of files) {
    const snapshotFile = path.join(OUTPUT_DIR, f);
    const safeDate = f.replace(/^parliament-|\.json$/g, '');
    const date = normalizeInputDate(safeDate);
    const partyMetaPath = path.join(OUTPUT_DIR, `partyMeta-${safeDate}.json`);
    if (!fs.existsSync(partyMetaPath)) {
      try {
        await runPartyMeta({ snapshot: snapshotFile });
      } catch {
        console.error(`Failed generating party meta for ${snapshotFile}`);
      }
    }
    try {
      indexByDate.set(date, buildIndexEntry(snapshotFile, date, safeDate));
    } catch {
      console.warn(`Skipping unreadable snapshot file ${f}`);
    }
  }
  const sorted = Array.from(indexByDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  fs.writeFileSync(PARLIAMENT_INDEX, JSON.stringify(sorted, null, 2));
  console.log(
    `Index written (fallback from existing snapshots): ${PARLIAMENT_INDEX}`
  );
};
