import axios from 'axios';

import { isQID } from './is-q-i-d.ts';

const WIKIDATA_SEARCH = 'https://www.wikidata.org/w/api.php';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const tryResolveQID = async (label: string): Promise<string | null> => {
  try {
    const url = `${WIKIDATA_SEARCH}?action=wbsearchentities&search=${encodeURIComponent(label)}&language=en&format=json&type=item&limit=1`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'civitas-party-meta-script/0.1' },
    });
    const id = res.data?.search?.[0]?.id;
    return id || null;
  } catch {
    return null;
  }
};

export const resolveQids = async (
  parties: Array<{ id: string; label: string; resolvedQid?: string }>
): Promise<void> => {
  for (const p of parties) {
    if (isQID(p.id)) continue;
    console.log(`Resolving QID for party label/id: ${p.id}`);
    const qid = await tryResolveQID(p.label);
    if (qid) {
      p.resolvedQid = qid;
      console.log(`  -> Resolved to ${qid}`);
    } else {
      console.log('  -> No QID found (will rely on label heuristics)');
    }
    await delay(120);
  }
};
