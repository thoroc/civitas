#!/usr/bin/env ts-node
/*
  Script: generateParliamentSnapshotsRange.ts
  Usage:
    ts-node --project scripts/tsconfig.scripts.json scripts/generateParliamentSnapshotsRange.ts --mode terms --throttle 300

  Description:
    Generates multiple parliament snapshots for either:
      --mode terms  (UK Parliament term boundary start dates discovered dynamically)
    And for each snapshot also generates a per-date party metadata file (partyMeta-<date>.json).

    Produces/updates an index file: public/data/parliament.index.json with summary entries:
      [{ date, safeDate, file, partyMetaFile, total, generatedAt }]

    Skips existing snapshot files unless --force is supplied.

*/
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { OUTPUT_DIR, PARLIAMENT_INDEX } from './lib/paths.ts';
import { toSafeFilename } from './lib/toSafeFilename.ts';
import {
  WIKIDATA_SPARQL_ENDPOINT,
  buildTermsQuery,
  buildTermsQueryFallback,
} from './lib/wikidata/index.ts';

interface Args {
  mode: 'terms';
  throttle: number;
  force: boolean;
}

const parseArgs = (): Args => {
  const modeIdx = process.argv.indexOf('--mode');
  const throttleIdx = process.argv.indexOf('--throttle');
  const force = process.argv.includes('--force');
  const mode = (
    modeIdx !== -1 ? process.argv[modeIdx + 1] : 'terms'
  ) as 'terms';
  const throttle =
    throttleIdx !== -1
      ? Number.parseInt(process.argv[throttleIdx + 1], 10)
      : 300;
  return { mode, throttle: Number.isNaN(throttle) ? 300 : throttle, force };
};

import { fetchWithRetry } from './lib/http.ts';

const fetchTermStartDates = async (): Promise<
  { term: string; start: string }[]
> => {
  type TermStart = { term: string; start: string };
  const MIN_DATE = '2005-01-01T00:00:00Z';

  const runQuery = async (
    query: string,
    label: string
  ): Promise<TermStart[]> => {
    const url = `${WIKIDATA_SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
    const res = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'civitas-batch-script/0.2',
        Accept: 'application/sparql-results+json',
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) {
      console.warn(`[terms] ${label} query HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    const terms = data?.results?.bindings || [];
    if (!Array.isArray(terms)) {
      console.warn(`[terms] ${label} unexpected response shape`);
      return [];
    }
    if (terms.length === 0) {
      console.warn(`[terms] ${label} returned 0 rows`);
    }
    return terms.map(
      (b: any): TermStart => ({
        term: b.term.value.split('/').pop(),
        start: b.start.value,
      })
    );
  };

  // Primary
  let terms = await runQuery(buildTermsQuery(), 'primary');
  if (terms.length === 0) {
    console.warn(
      '[terms] falling back to simplified query (no subclass traversal)'
    );
    terms = await runQuery(buildTermsQueryFallback(), 'fallback');
  }
  if (terms.length === 0) {
    console.warn(
      '[terms] no term start dates resolved after retries + fallback'
    );
  }
  return terms.filter(r => r.start >= MIN_DATE);
};

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: main orchestration IIFE coordinates snapshot generation
(async () => {
  const { mode, throttle, force } = parseArgs();
  if (mode !== 'terms') {
    console.error('Only --mode terms supported currently');
    process.exit(1);
  }

  console.log('Discovering UK Parliament terms from Wikidata...');
  const terms = await fetchTermStartDates();
  // Deduplicate by start date and sort
  const uniqueStarts = Array.from(new Set(terms.map(t => t.start))).sort();
  console.log(`Found ${uniqueStarts.length} term start dates (>=2005).`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let index: any[] = [];
  if (fs.existsSync(PARLIAMENT_INDEX)) {
    try {
      index = JSON.parse(fs.readFileSync(PARLIAMENT_INDEX, 'utf-8'));
    } catch {
      index = [];
    }
  }
  const indexByDate = new Map(index.map(e => [e.date, e]));

  if (uniqueStarts.length === 0) {
    console.warn(
      'No term start dates discovered from SPARQL; falling back to existing snapshot files.'
    );
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
      try {
        const snap = JSON.parse(fs.readFileSync(snapshotFile, 'utf-8'));
        const safeDate = f.replace(/^parliament-|\.json$/g, '');
        const date = snap.meta?.date || safeDate.replace(/-/g, ':');
        const partyMetaFilePath = path.join(
          OUTPUT_DIR,
          `partyMeta-${safeDate}.json`
        );
        if (!fs.existsSync(partyMetaFilePath)) {
          try {
            execFileSync(
              'ts-node',
              [
                '--project',
                'scripts/tsconfig.scripts.json',
                'scripts/generatePartyMeta.ts',
                '--snapshot',
                snapshotFile,
              ],
              { stdio: 'inherit' }
            );
          } catch {
            console.error(
              `Failed generating party meta for existing snapshot ${snapshotFile}`
            );
          }
        }
        const summary = {
          date,
          safeDate,
          file: f,
          partyMetaFile: fs.existsSync(partyMetaFilePath)
            ? `partyMeta-${safeDate}.json`
            : null,
          total: snap.meta?.total || snap.members?.length || 0,
          generatedAt:
            snap.meta?.generatedAt ||
            fs.statSync(snapshotFile).mtime.toISOString(),
        };
        indexByDate.set(summary.date, summary);
      } catch {
        console.warn(`Skipping unreadable snapshot file ${f}`);
      }
    }
    const fallbackIndex = Array.from(indexByDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    fs.writeFileSync(PARLIAMENT_INDEX, JSON.stringify(fallbackIndex, null, 2));
    console.log(
      `Index written (fallback from existing snapshots): ${PARLIAMENT_INDEX}`
    );
    return;
  }

  for (const start of uniqueStarts) {
    const date = start; // Use exact start timestamp
    const safeDate = toSafeFilename(start);
    const snapshotFile = path.join(OUTPUT_DIR, `parliament-${safeDate}.json`);
    if (fs.existsSync(snapshotFile) && !force) {
      console.log(`Skipping existing snapshot ${snapshotFile}`);
    } else {
      console.log(`Generating snapshot for ${date}`);
      try {
        execFileSync(
          'ts-node',
          [
            '--project',
            'scripts/tsconfig.scripts.json',
            'scripts/generateParliamentSnapshot.ts',
            '--date',
            date,
          ],
          { stdio: 'inherit' }
        );
      } catch (e) {
        console.error(`Failed snapshot for ${date}`, e);
        continue;
      }
    }
    // Generate per-date party meta
    try {
      execFileSync(
        'ts-node',
        [
          '--project',
          'scripts/tsconfig.scripts.json',
          'scripts/generatePartyMeta.ts',
          '--snapshot',
          snapshotFile,
        ],
        { stdio: 'inherit' }
      );
    } catch (e) {
      console.error(`Failed party meta for ${date}`, e);
    }

    // Load snapshot summary
    try {
      const snap = JSON.parse(fs.readFileSync(snapshotFile, 'utf-8'));
      const partyMetaFile = path.join(OUTPUT_DIR, `partyMeta-${safeDate}.json`);
      const summary = {
        date: snap.meta?.date || date,
        safeDate,
        file: `parliament-${safeDate}.json`,
        partyMetaFile: fs.existsSync(partyMetaFile)
          ? `partyMeta-${safeDate}.json`
          : null,
        total: snap.meta?.total || snap.members?.length || 0,
        generatedAt:
          snap.meta?.generatedAt ||
          fs.statSync(snapshotFile).mtime.toISOString(),
      };
      indexByDate.set(summary.date, summary);
    } catch {
      console.warn(`Could not index snapshot ${snapshotFile}`);
    }

    await sleep(throttle);
  }

  index = Array.from(indexByDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  fs.writeFileSync(PARLIAMENT_INDEX, JSON.stringify(index, null, 2));
  console.log(`Index written: ${PARLIAMENT_INDEX}`);
})();
