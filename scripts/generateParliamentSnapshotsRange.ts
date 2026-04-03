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

const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql';

const fetchTermStartDates = async (): Promise<
  { term: string; start: string }[]
> => {
  type TermStart = { term: string; start: string };
  const MIN_DATE = '2005-01-01T00:00:00Z';
  const PRIMARY_QUERY = `SELECT ?term ?termLabel ?start WHERE {
    ?term wdt:P31/wdt:P279* wd:Q15238777 ; wdt:P194 wd:Q11005 ; wdt:P580 ?start .
    OPTIONAL { ?term wdt:P582 ?end }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  } ORDER BY ?start`;
  // Fallback drops the subclass traversal which occasionally returns zero rows under load / caching anomalies
  const FALLBACK_QUERY = `SELECT ?term ?termLabel ?start WHERE {
    ?term wdt:P31 wd:Q15238777 ; wdt:P194 wd:Q11005 ; wdt:P580 ?start .
    OPTIONAL { ?term wdt:P582 ?end }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  } ORDER BY ?start`;

  const runQuery = async (
    query: string,
    label: string
  ): Promise<TermStart[]> => {
    const url = `${WIKIDATA_SPARQL}?format=json&query=${encodeURIComponent(query)}`;
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
  let terms = await runQuery(PRIMARY_QUERY, 'primary');
  if (terms.length === 0) {
    console.warn(
      '[terms] falling back to simplified query (no subclass traversal)'
    );
    terms = await runQuery(FALLBACK_QUERY, 'fallback');
  }
  if (terms.length === 0) {
    console.warn(
      '[terms] no term start dates resolved after retries + fallback'
    );
  }
  return terms.filter(r => r.start >= MIN_DATE);
};

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: legacy entry-point script
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

  const outDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const indexFile = path.join(outDir, 'parliament.index.json');
  let index: any[] = [];
  if (fs.existsSync(indexFile)) {
    try {
      index = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
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
      .readdirSync(outDir)
      .filter(f =>
        /^parliament-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/.test(f)
      );
    if (!files.length) {
      console.warn(
        'No existing parliament-* snapshot files found. Writing empty index.'
      );
      fs.writeFileSync(indexFile, JSON.stringify([], null, 2));
      console.log(`Index written: ${indexFile}`);
      return;
    }
    for (const f of files) {
      const snapshotFile = path.join(outDir, f);
      try {
        const snap = JSON.parse(fs.readFileSync(snapshotFile, 'utf-8'));
        const safeDate = f.replace(/^parliament-|\.json$/g, '');
        const date = snap.meta?.date || safeDate.replace(/-/g, ':');
        const partyMetaFilePath = path.join(
          outDir,
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
    fs.writeFileSync(indexFile, JSON.stringify(fallbackIndex, null, 2));
    console.log(
      `Index written (fallback from existing snapshots): ${indexFile}`
    );
    return;
  }

  for (const start of uniqueStarts) {
    const date = start; // Use exact start timestamp
    const safeDate = date.replace(/:/g, '-');
    const snapshotFile = path.join(outDir, `parliament-${safeDate}.json`);
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
      const partyMetaFile = path.join(outDir, `partyMeta-${safeDate}.json`);
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
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
  console.log(`Index written: ${indexFile}`);
})();
