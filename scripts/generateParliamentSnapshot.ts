#!/usr/bin/env ts-node
/*
  Script: generateParliamentSnapshot.ts
  Usage: npx ts-node scripts/generateParliamentSnapshot.ts --date 2021-01-01T00:00:00Z
  Description: Fetches parliament members at a given date from Wikidata and stores a normalized snapshot JSON under public/data.
*/
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { ParliamentSnapshot, Member, Party, Constituency } from '../src/app/parliament/types';

interface Args { date: string; mergeLabourCoop: boolean }

const parseArgs = (): Args => {
  const dateIndex = process.argv.indexOf('--date');
  if (dateIndex === -1 || !process.argv[dateIndex + 1]) {
    console.error('Missing required --date argument (ISO date e.g. 2021-01-01T00:00:00Z)');
    process.exit(1);
  }
  const mergeLabourCoop = process.argv.includes('--merge-labour-coop');
  return { date: process.argv[dateIndex + 1], mergeLabourCoop };
};

const buildQuery = (date: string, mergeLabourCoop: boolean): string => {
  const labourMergeBind = mergeLabourCoop
    ? 'BIND ( IF (?party = wd:Q6467393 ,wd:Q9630, ?party) as ?partyText)'
    : 'BIND (?party AS ?partyText)';
  return `SELECT ?mp ?mpLabel ?constituency ?constituencyLabel ?partyText ?partyLabel ?genderLabel ?rgb (SAMPLE(?age) AS ?age) WITH { 
SELECT ?parliament $DATE WHERE {
  VALUES $DATE { "${date}"^^xsd:dateTime }
  ?parliament wdt:P31/wdt:P279* wd:Q15238777 ;  # instance / subclass of parliamentary term
             wdt:P194 wd:Q11005 ;               # legislative body: UK Parliament
             wdt:P580 ?start_date .
  OPTIONAL { ?parliament wdt:P582 ?end_date }
  BIND(IF(!BOUND(?end_date), NOW(), ?end_date) AS ?end_date)
  FILTER (?start_date <= $DATE && ?end_date >= $DATE)
}} AS %Parliament
WHERE {
  INCLUDE %Parliament
  ?mp wdt:P31 wd:Q5 .
  ?mp p:P39 ?term_stmt .
  ?term_stmt ps:P39 ?term .
  ?term_stmt pq:P2937 ?parliament .
  OPTIONAL { ?term_stmt pq:P580 ?mp_start_date }
  OPTIONAL { ?term_stmt pq:P768 ?constituency }
  ?parliament wdt:P580 ?parliament_start .
  BIND(IF(!BOUND(?mp_start_date), ?parliament_start, ?mp_start_date) AS ?mp_start_date)
  OPTIONAL { ?term_stmt pq:P4100 ?party }
  OPTIONAL { ?term_stmt pq:P582 ?mp_end_date }
  BIND(IF(!BOUND(?mp_end_date), NOW(), ?mp_end_date) AS ?mp_end_date)
  FILTER (?mp_start_date <= $DATE && ?mp_end_date >= $DATE)
  BIND(IF(BOUND(?party), ?party, wd:Q24238356) AS ?party)
  OPTIONAL { ?party wdt:P465 ?rgb }
  BIND(IF(BOUND(?rgb), ?rgb, "808080") AS ?rgb)
  OPTIONAL { ?mp wdt:P21 ?gender }
  BIND(IF(BOUND(?gender), ?gender, wd:Q24238356) AS ?gender)
  ${labourMergeBind}
  OPTIONAL { ?mp wdt:P569 ?dob }
  OPTIONAL { ?mp wdt:P570 ?dod }
  BIND(IF(BOUND(?dod), ?dod, NOW()) AS ?dod)
  BIND(?dod - ?dob AS ?ageInDays)
  BIND(?ageInDays/365.2425 AS ?ageInYears)
  BIND(FLOOR(?ageInYears) AS ?age)
  BIND(IF(BOUND(?age), ?age, 0) AS ?age)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
} GROUP BY ?mp ?mpLabel ?constituency ?constituencyLabel ?partyText ?partyLabel ?genderLabel ?rgb`;
};

const fetchData = async (query: string) => {
  const endpoint = 'https://query.wikidata.org/sparql';
  const url = endpoint + '?format=json&query=' + encodeURIComponent(query);
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      if (attempt > 1) {
        const backoff = 500 * Math.pow(2, attempt - 2); // 500, 1000ms
        await new Promise(res => setTimeout(res, backoff));
        console.warn(`[snapshot] retry ${attempt - 1} after backoff ${backoff}ms`);
      }
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'civitas-snapshot-script/0.2',
          'Accept': 'application/sparql-results+json',
          'Cache-Control': 'no-cache'
        },
        validateStatus: () => true,
      });
      if (res.status !== 200) {
        console.warn(`[snapshot] HTTP ${res.status} fetching snapshot data`);
        if (res.status === 429 || res.status >= 500) continue;
        break; // non-retriable
      }
      if (!res.data?.results?.bindings) {
        console.warn('[snapshot] unexpected response shape');
        continue;
      }
      return res.data;
    } catch (e: any) {
      console.warn(`[snapshot] attempt error: ${e?.message || e}`);
      if (attempt === MAX_ATTEMPTS) throw e;
    }
  }
  return { results: { bindings: [] } }; // fallback empty
};

const normalize = (raw: any): Member[] => {
  if (!raw?.results?.bindings) {
    console.warn('Unexpected SPARQL structure');
    return [];
  }
  return raw.results.bindings.map((b: any) => {
    const partyEntity = b.partyText || b.party; // partyText is merged party when flag enabled
    const party: Party | null = partyEntity?.value ? {
      id: partyEntity.value.replace('http://www.wikidata.org/entity/', ''),
      label: b.partyLabel?.value || partyEntity.value.replace('http://www.wikidata.org/entity/', ''),
      color: `#${b.rgb?.value || '808080'}`
    } : null;

    const constituency: Constituency | null = b.constituency ? {
      id: b.constituency.value,
      label: b.constituencyLabel?.value || b.constituency.value
    } : null;

    const member: Member = {
      id: b.mp.value.replace('http://www.wikidata.org/entity/', ''),
      label: b.mpLabel?.value || b.mp.value.replace('http://www.wikidata.org/entity/', ''),
      constituency,
      party,
      gender: b.genderLabel?.value || null,
      age: b.age?.value ? parseInt(b.age.value) : null,
    };
    return member;
  });
};

const normalizeDate = (input: string): string => {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/.test(input)) {
    return input.replace(/^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})Z$/, '$1:$2:$3Z');
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(input)) {
    return input;
  }
  console.error('Unsupported date format. Use 2021-01-01T00-00-00Z or 2021-01-01T00:00:00Z');
  process.exit(1);
};

(async () => {
  const { date: inputDate, mergeLabourCoop } = parseArgs();
  const isoDate = normalizeDate(inputDate);
  console.log(`Fetching parliament snapshot for ${inputDate} (ISO: ${isoDate})`);
  const query = buildQuery(isoDate, mergeLabourCoop);
  const raw = await fetchData(query);
  const members = normalize(raw);
  const snapshot: ParliamentSnapshot = {
    meta: { date: isoDate, generatedAt: new Date().toISOString(), total: members.length },
    members,
  };
  const outDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const safeDate = isoDate.replace(/:/g, '-');
  const outFile = path.join(outDir, `parliament-${safeDate}.json`);
  fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2));
  console.log(`Snapshot written: ${outFile} (members: ${members.length})`);
})();
