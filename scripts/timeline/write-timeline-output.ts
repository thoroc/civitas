import fs from 'node:fs';
import path from 'node:path';

import type { Snapshot } from '../harvest';
import { OFFICIAL_DIR, OFFICIAL_INDEX, toSafeFilename } from '../lib';

export const writeTimelineOutput = (
  snapshots: Snapshot[],
  events: unknown[]
): void => {
  if (!fs.existsSync(OFFICIAL_DIR))
    fs.mkdirSync(OFFICIAL_DIR, { recursive: true });

  fs.writeFileSync(
    path.join(OFFICIAL_DIR, 'events.json'),
    JSON.stringify(events, null, 2)
  );

  // Deduplicate by date — multiple events on the same day each emit a snapshot;
  // keep the last one (most complete state after all events on that day).
  const byDate = new Map<string, Snapshot>();
  for (const sn of snapshots) byDate.set(sn.date, sn);
  const deduped = [...byDate.values()];

  const index: Array<{
    date: string;
    safeDate: string;
    file: string;
    total: number;
    generatedAt: string;
    eventType: Snapshot['eventType'];
  }> = [];
  for (const sn of deduped) {
    const safeDate = toSafeFilename(sn.date);
    const file = `official-parliament-${safeDate}.json`;
    fs.writeFileSync(
      path.join(OFFICIAL_DIR, file),
      JSON.stringify(sn, null, 2)
    );
    index.push({
      date: sn.date,
      safeDate,
      file,
      total: sn.total,
      generatedAt: sn.meta.generatedAt,
      eventType: sn.eventType,
    });
  }
  fs.writeFileSync(OFFICIAL_INDEX, JSON.stringify(index, null, 2));
  console.log(
    `[official] Wrote ${deduped.length} snapshots to ${OFFICIAL_DIR} (${snapshots.length - deduped.length} duplicates removed)`
  );
};
