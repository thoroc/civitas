#!/usr/bin/env ts-node
/*
  Script: generatePartyMeta.ts
  Usage: npx ts-node --project scripts/tsconfig.scripts.json scripts/generatePartyMeta.ts --snapshot public/data/parliament-2021-01-01T00-00-00Z.json
  Description:
    Reads an existing parliament snapshot JSON and produces a party metadata file
    (public/data/partyMeta.json) containing inferred ideological leaning for each party.

    Leaning inference order of precedence:
      1. Explicit overrides file (public/data/partyMeta.overrides.json) if present
      2. Ideology labels fetched from Wikidata (properties P1142, P1387) mapped via keyword rules
      3. Party label keyword heuristics
      4. Default to 'center'

    Also assigns a coarse spectrumPosition (left=0.25, center=0.5, right=0.75) for future visualization.

    NOTE: Current snapshot script stores party.id as a label (not QID). We attempt to resolve a QID using
    the Wikidata search API when an id does not look like a QID (Q\d+). For best results, consider updating
    the snapshot generator to include the party QID directly.
*/
import fs from 'fs';
import path from 'path';
import axios from 'axios';

interface SnapshotMemberParty { id: string; label: string; color: string; }
interface SnapshotMember { party: SnapshotMemberParty | null }
interface Snapshot { members: SnapshotMember[] }

interface PartyMetaSourceInfo {
  ideologies: string[];
  matched: string[];
  method: 'override' | 'ideology-labels' | 'party-label-regex' | 'fallback';
  generatedAt: string;
}

export type Leaning = 'left' | 'center' | 'right';

interface PartyMetaRecord {
  id: string;            // Prefer QID if resolved; fallback to snapshot id/label
  label: string;
  color: string;
  leaning: Leaning;
  spectrumPosition: number; // coarse numeric placement for potential future use
  source: PartyMetaSourceInfo;
  originalSnapshotId: string; // to help reconcile if id != QID
  qidResolved: boolean;
}

interface Args { snapshot: string }

const parseArgs = (): Args => {
  const snapIdx = process.argv.indexOf('--snapshot');
  if (snapIdx === -1 || !process.argv[snapIdx + 1]) {
    console.error('Missing required --snapshot path to an existing parliament snapshot JSON');
    process.exit(1);
  }
  return { snapshot: process.argv[snapIdx + 1] };
};

const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql';
const WIKIDATA_SEARCH = 'https://www.wikidata.org/w/api.php';

// Keyword regex lists (lowercase) for ideology detection
const KEYWORDS = {
  left: [
    /social/, /labou?r/, /green/, /social[- ]?democ/, /democratic socialism/, /progressive/, /ecologist/, /environmental/, /sinn/, /plaid/, /socialist/,
  ],
  right: [
    /conservative/, /unionist/, /libertarian/, /nationalist/, /right-?wing/, /reform/, /ukip/, /patriot/, /populis(t|m)/,
  ],
  center: [
    /liberal/, /centrist/, /christian[- ]?democ/, /moderate/,
  ]
};

const spectrumMap: Record<Leaning, number> = { left: 0.25, center: 0.5, right: 0.75 };

const isQID = (s: string) => /^Q\d+$/.test(s.trim());

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const loadSnapshot = (file: string): Snapshot => {
  if (!fs.existsSync(file)) {
    console.error(`Snapshot not found: ${file}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as Snapshot;
};

const tryResolveQID = async (label: string): Promise<string | null> => {
  try {
    const url = `${WIKIDATA_SEARCH}?action=wbsearchentities&search=${encodeURIComponent(label)}&language=en&format=json&type=item&limit=1`;
    const res = await axios.get(url, { headers: { 'User-Agent': 'civitas-party-meta-script/0.1' } });
    const id = res.data?.search?.[0]?.id;
    return id || null;
  } catch (e) {
    return null;
  }
};

const buildIdeologyQuery = (qids: string[]): string => {
  return `SELECT ?party ?partyLabel ?ideology ?ideologyLabel WHERE { VALUES ?party { ${qids.map(q => `wd:${q}`).join(' ')} } OPTIONAL { ?party wdt:P1142 ?ideology . } OPTIONAL { ?party wdt:P1387 ?ideology . } SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". } }`;
};

interface IdeologyRow { party: string; ideologyLabel?: string }

const fetchIdeologies = async (qids: string[]): Promise<Map<string, string[]>> => {
  const map = new Map<string, string[]>();
  if (qids.length === 0) return map;
  const query = buildIdeologyQuery(qids);
  const url = WIKIDATA_SPARQL + '?format=json&query=' + encodeURIComponent(query);
  const res = await axios.get(url, { headers: { 'User-Agent': 'civitas-party-meta-script/0.1' } });
  const bindings = res.data?.results?.bindings || [];
  for (const b of bindings) {
    const partyURI: string | undefined = b.party?.value;
    if (!partyURI) continue;
    const qid = partyURI.split('/').pop()!;
    const label = b.ideologyLabel?.value;
    if (label) {
      if (!map.has(qid)) map.set(qid, []);
      map.get(qid)!.push(label);
    }
  }
  return map;
};

const matchLeaningFromTextArray = (texts: string[], partyLabel: string): { leaning: Leaning; matched: string[]; method: PartyMetaSourceInfo['method'] } => {
  const collectMatches = (bucket: Leaning, source: string): string[] => {
    const res: string[] = [];
    for (const rx of KEYWORDS[bucket]) {
      if (rx.test(source)) res.push(rx.source);
    }
    return res;
  };

  // 1. Use ideology texts
  let ideologyMatches: { leaning: Leaning; matches: string[] }[] = [];
  for (const leaning of ['left', 'center', 'right'] as Leaning[]) {
    const matches = texts.flatMap(t => collectMatches(leaning, t.toLowerCase()));
    if (matches.length) ideologyMatches.push({ leaning, matches });
  }
  if (ideologyMatches.length) {
    ideologyMatches.sort((a, b) => b.matches.length - a.matches.length);
    const top = ideologyMatches[0];
    return { leaning: top.leaning, matched: top.matches, method: 'ideology-labels' };
  }
  // 2. Fallback to party label heuristics
  const labelLC = partyLabel.toLowerCase();
  // Order adjusted to evaluate 'right' before 'center' so parties containing both conservative and liberal indicators classify as right.
  for (const leaning of ['left', 'right', 'center'] as Leaning[]) {
    const matches = collectMatches(leaning, labelLC);
    if (matches.length) {
      return { leaning, matched: matches, method: 'party-label-regex' };
    }
  }
  // 3. Default center
  return { leaning: 'center', matched: [], method: 'fallback' };
};

const loadOverrides = (): Record<string, Partial<PartyMetaRecord>> => {
  const overridePath = path.join(process.cwd(), 'public', 'data', 'partyMeta.overrides.json');
  if (!fs.existsSync(overridePath)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(overridePath, 'utf-8'));
    return raw;
  } catch (e) {
    console.warn('Failed parsing overrides, ignoring.');
    return {};
  }
};

(async () => {
  const { snapshot } = parseArgs();
  console.log(`Reading snapshot: ${snapshot}`);
  const snap = loadSnapshot(snapshot);
  const partiesMap = new Map<string, { label: string; color: string }>();
  for (const m of snap.members) {
    if (!m.party) continue;
    if (!partiesMap.has(m.party.id)) partiesMap.set(m.party.id, { label: m.party.label, color: m.party.color });
  }
  const parties = Array.from(partiesMap.entries()).map(([id, v]) => ({ id, label: v.label, color: v.color }));
  console.log(`Found ${parties.length} unique parties in snapshot.`);

  // Resolve QIDs where needed
  for (const p of parties) {
    if (isQID(p.id)) continue;
    console.log(`Resolving QID for party label/id: ${p.id}`);
    const qid = await tryResolveQID(p.label);
    if (qid) {
      (p as any).resolvedQid = qid;
      console.log(`  -> Resolved to ${qid}`);
    } else {
      console.log('  -> No QID found (will rely on label heuristics)');
    }
    await delay(120); // gentle throttle
  }

  const qids = parties.map(p => (p as any).resolvedQid || (isQID(p.id) ? p.id : null)).filter(Boolean) as string[];
  const ideologyMap = await fetchIdeologies(qids);

  const overrides = loadOverrides();

  const records: PartyMetaRecord[] = [];
  const now = new Date().toISOString();
  for (const p of parties) {
    const qid: string | undefined = (p as any).resolvedQid || (isQID(p.id) ? p.id : undefined);
    const override = overrides[p.id] || (qid ? overrides[qid] : undefined) || undefined;
    let leaning: Leaning;
    let matched: string[] = [];
    let method: PartyMetaSourceInfo['method'];

    if (override?.leaning) {
      leaning = override.leaning as Leaning;
      matched = [];
      method = 'override';
    } else {
      const ideologyLabels = qid ? ideologyMap.get(qid) || [] : [];
      const result = matchLeaningFromTextArray(ideologyLabels, p.label);
      leaning = result.leaning;
      matched = result.matched;
      method = result.method;
    }
    const rec: PartyMetaRecord = {
      id: qid || p.id,
      originalSnapshotId: p.id,
      qidResolved: Boolean(qid),
      label: p.label,
      color: p.color,
      leaning,
      spectrumPosition: spectrumMap[leaning],
      source: {
        ideologies: qid ? ideologyMap.get(qid) || [] : [],
        matched,
        method,
        generatedAt: now,
      },
    };
    if (override) {
      if (override.label) rec.label = override.label;
      if ((override as any).spectrumPosition !== undefined) rec.spectrumPosition = (override as any).spectrumPosition;
    }
    records.push(rec);
  }

  const outDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'partyMeta.json');
  fs.writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), parties: records }, null, 2));
  console.log(`Party meta written: ${outFile}`);
})();
