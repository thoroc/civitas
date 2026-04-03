import axios from 'axios';

import {
  WIKIDATA_SPARQL_ENDPOINT,
  buildIdeologyQuery,
} from '../../lib/wikidata/index.ts';

export const fetchIdeologies = async (
  qids: string[]
): Promise<Map<string, string[]>> => {
  const map = new Map<string, string[]>();
  if (qids.length === 0) return map;
  const query = buildIdeologyQuery(qids);
  const url = `${WIKIDATA_SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'civitas-party-meta-script/0.1' },
  });
  const bindings = res.data?.results?.bindings || [];
  for (const b of bindings) {
    const partyURI: string | undefined = b.party?.value;
    if (!partyURI) continue;
    const qid = partyURI.split('/').at(-1);
    if (!qid) continue;
    const label = b.ideologyLabel?.value;
    if (label) {
      if (!map.has(qid)) map.set(qid, []);
      map.get(qid)?.push(label);
    }
  }
  return map;
};
