import fs from 'node:fs';
import path from 'node:path';

import { OUTPUT_DIR, PARLIAMENT_INDEX } from '../lib/paths.ts';
import { sleep } from '../lib/sleep.ts';
import { toSafeFilename } from '../lib/toSafeFilename.ts';
import { buildIndexEntry } from '../range/buildIndexEntry.ts';
import type { IndexEntry } from '../range/buildIndexEntry.ts';
import { fetchTermStartDates } from '../range/fetchTermStartDates.ts';
import { handleFallbackRange } from '../range/range-fallback.ts';
import { runPartyMeta } from './party-meta.ts';
import { runSnapshot } from './snapshot.ts';

export type RangeOptions = {
  mode: 'terms';
  throttle: number;
  force: boolean;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: orchestrates snapshot+party-meta generation across multiple term dates with fallback
export const runRange = async (opts: RangeOptions): Promise<void> => {
  const { throttle, force } = opts;

  console.log('Discovering UK Parliament terms from Wikidata...');
  const terms = await fetchTermStartDates();
  const uniqueStarts = Array.from(new Set(terms.map(t => t.start))).sort();
  console.log(`Found ${uniqueStarts.length} term start dates (>=2005).`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let existing: IndexEntry[] = [];
  if (fs.existsSync(PARLIAMENT_INDEX)) {
    try {
      existing = JSON.parse(fs.readFileSync(PARLIAMENT_INDEX, 'utf-8'));
    } catch {
      existing = [];
    }
  }
  const indexByDate = new Map<string, IndexEntry>(
    existing.map(e => [e.date, e])
  );

  if (uniqueStarts.length === 0) {
    console.warn(
      'No term start dates from SPARQL; falling back to existing snapshot files.'
    );
    await handleFallbackRange(indexByDate);
    return;
  }

  for (const start of uniqueStarts) {
    const safeDate = toSafeFilename(start);
    const snapshotFile = path.join(OUTPUT_DIR, `parliament-${safeDate}.json`);
    if (fs.existsSync(snapshotFile) && !force) {
      console.log(`Skipping existing snapshot ${snapshotFile}`);
    } else {
      console.log(`Generating snapshot for ${start}`);
      try {
        await runSnapshot({ date: start, mergeLabourCoop: false });
      } catch (e) {
        console.error(`Failed snapshot for ${start}`, e);
        continue;
      }
    }
    try {
      await runPartyMeta({ snapshot: snapshotFile });
    } catch (e) {
      console.error(`Failed party meta for ${start}`, e);
    }
    try {
      indexByDate.set(start, buildIndexEntry(snapshotFile, start, safeDate));
    } catch {
      console.warn(`Could not index snapshot ${snapshotFile}`);
    }
    await sleep(throttle);
  }

  const sorted = Array.from(indexByDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  fs.writeFileSync(PARLIAMENT_INDEX, JSON.stringify(sorted, null, 2));
  console.log(`Index written: ${PARLIAMENT_INDEX}`);
};
