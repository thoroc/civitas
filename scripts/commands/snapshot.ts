import fs from 'node:fs';
import path from 'node:path';

import {
  OUTPUT_DIR,
  fetchWithRetry,
  normalizeInputDate,
  toSafeFilename,
} from '../lib';
import {
  WIKIDATA_SPARQL_ENDPOINT,
  buildParliamentMembersQuery,
} from '../lib/wikidata';

import { normalizeBindings } from '../snapshot';

import type { ParliamentSnapshot } from '../../src/app/parliament/types';

export type SnapshotOptions = { date: string; mergeLabourCoop: boolean };

export const runSnapshot = async (opts: SnapshotOptions): Promise<void> => {
  const { date: inputDate, mergeLabourCoop } = opts;
  const isoDate = normalizeInputDate(inputDate);
  console.log(
    `Fetching parliament snapshot for ${inputDate} (ISO: ${isoDate})`
  );

  const query = buildParliamentMembersQuery(isoDate, mergeLabourCoop);
  const url = `${WIKIDATA_SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;

  const res = await fetchWithRetry(url, {
    headers: {
      'User-Agent': 'civitas-snapshot-script/0.2',
      Accept: 'application/sparql-results+json',
      'Cache-Control': 'no-cache',
    },
  });

  let raw: unknown;
  if (!res.ok) {
    console.warn(`[snapshot] HTTP ${res.status} fetching snapshot data`);
    raw = { results: { bindings: [] } };
  } else {
    raw = await res.json();
  }

  const members = normalizeBindings(raw);
  const snapshot: ParliamentSnapshot = {
    meta: {
      date: isoDate,
      generatedAt: new Date().toISOString(),
      total: members.length,
    },
    members,
  };

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const safeDate = toSafeFilename(isoDate);
  const outFile = path.join(OUTPUT_DIR, `parliament-${safeDate}.json`);
  fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2));
  console.log(`Snapshot written: ${outFile} (members: ${members.length})`);
};
