#!/usr/bin/env ts-node
/*
  Script: generateParliamentSnapshot.ts
  Usage: npx ts-node scripts/generateParliamentSnapshot.ts --date 2021-01-01T00:00:00Z
  Description: Fetches parliament members at a given date from Wikidata and stores a normalized snapshot JSON under public/data.
*/
import fs from 'node:fs';
import path from 'node:path';

import { fetchWithRetry } from './lib/http.ts';

import { normalizeInputDate } from './lib/normalizeInputDate.ts';
import {
  WIKIDATA_SPARQL_ENDPOINT,
  buildParliamentMembersQuery,
} from './lib/wikidata/index.ts';

import type {
  Constituency,
  Member,
  ParliamentSnapshot,
  Party,
} from '../src/app/parliament/types';

interface Args {
  date: string;
  mergeLabourCoop: boolean;
}

const parseArgs = (): Args => {
  const dateIndex = process.argv.indexOf('--date');
  if (dateIndex === -1 || !process.argv[dateIndex + 1]) {
    console.error(
      'Missing required --date argument (ISO date e.g. 2021-01-01T00:00:00Z)'
    );
    process.exit(1);
  }
  const mergeLabourCoop = process.argv.includes('--merge-labour-coop');
  return { date: process.argv[dateIndex + 1], mergeLabourCoop };
};

const fetchData = async (query: string) => {
  const url = `${WIKIDATA_SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
  const res = await fetchWithRetry(url, {
    headers: {
      'User-Agent': 'civitas-snapshot-script/0.2',
      Accept: 'application/sparql-results+json',
      'Cache-Control': 'no-cache',
    },
  });
  if (!res.ok) {
    console.warn(`[snapshot] HTTP ${res.status} fetching snapshot data`);
    return { results: { bindings: [] } };
  }
  return res.json();
};

const normalize = (raw: any): Member[] => {
  if (!raw?.results?.bindings) {
    console.warn('Unexpected SPARQL structure');
    return [];
  }
  return raw.results.bindings.map((b: any) => {
    const partyEntity = b.partyText || b.party; // partyText is merged party when flag enabled
    const party: Party | null = partyEntity?.value
      ? {
          id: partyEntity.value.replace('http://www.wikidata.org/entity/', ''),
          label:
            b.partyLabel?.value ||
            partyEntity.value.replace('http://www.wikidata.org/entity/', ''),
          color: `#${b.rgb?.value || '808080'}`,
        }
      : null;

    const constituency: Constituency | null = b.constituency
      ? {
          id: b.constituency.value,
          label: b.constituencyLabel?.value || b.constituency.value,
        }
      : null;

    const member: Member = {
      id: b.mp.value.replace('http://www.wikidata.org/entity/', ''),
      label:
        b.mpLabel?.value ||
        b.mp.value.replace('http://www.wikidata.org/entity/', ''),
      constituency,
      party,
      gender: b.genderLabel?.value || null,
      age: b.age?.value ? Number.parseInt(b.age.value) : null,
    };
    return member;
  });
};

(async () => {
  const { date: inputDate, mergeLabourCoop } = parseArgs();
  const isoDate = normalizeInputDate(inputDate);
  console.log(
    `Fetching parliament snapshot for ${inputDate} (ISO: ${isoDate})`
  );
  const query = buildParliamentMembersQuery(isoDate, mergeLabourCoop);
  const raw = await fetchData(query);
  const members = normalize(raw);
  const snapshot: ParliamentSnapshot = {
    meta: {
      date: isoDate,
      generatedAt: new Date().toISOString(),
      total: members.length,
    },
    members,
  };
  const outDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const safeDate = isoDate.replace(/:/g, '-');
  const outFile = path.join(outDir, `parliament-${safeDate}.json`);
  fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2));
  console.log(`Snapshot written: ${outFile} (members: ${members.length})`);
})();
