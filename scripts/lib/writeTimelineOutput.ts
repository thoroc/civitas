import fs from 'node:fs';
import path from 'node:path';

import type { Snapshot } from '../harvest/schemas.ts';
import { OFFICIAL_DIR, OFFICIAL_INDEX } from './paths.ts';
import { toSafeFilename } from './toSafeFilename.ts';

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

  const index: Array<{
    date: string;
    safeDate: string;
    file: string;
    total: number;
    generatedAt: string;
  }> = [];
  for (const sn of snapshots) {
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
    });
  }
  fs.writeFileSync(OFFICIAL_INDEX, JSON.stringify(index, null, 2));
  console.log(
    `[official] Wrote ${snapshots.length} snapshots to ${OFFICIAL_DIR}`
  );
};
