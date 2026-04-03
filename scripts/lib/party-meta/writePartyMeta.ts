import fs from 'node:fs';
import path from 'node:path';

import type { PartyMetaRecord } from './types.ts';

interface PartyMetaPayload {
  generatedAt: string;
  parties: PartyMetaRecord[];
}

export const writePartyMeta = (
  snapshotPath: string,
  payload: PartyMetaPayload
): void => {
  const outDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'partyMeta.json');
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(`Party meta written: ${outFile}`);

  try {
    const rawSnap = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8')) as {
      meta?: { date?: string };
    };
    const snapDate = rawSnap?.meta?.date;
    if (snapDate) {
      const safeDate = snapDate.replace(/:/g, '-');
      const datedFile = path.join(outDir, `partyMeta-${safeDate}.json`);
      fs.writeFileSync(
        datedFile,
        JSON.stringify({ ...payload, snapshotDate: snapDate }, null, 2)
      );
      console.log(`Per-date party meta written: ${datedFile}`);
    }
  } catch {
    // ignore
  }
};
