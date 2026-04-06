import { fetchWithRetry } from './http.ts';
import { WIKIDATA_SPARQL_ENDPOINT } from './wikidata/index.ts';

export type TermStart = { term: string; start: string };
type SparqlBinding = { term: { value: string }; start: { value: string } };

export const runTermsQuery = async (
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
    (b: SparqlBinding): TermStart => ({
      term: b.term.value.split('/').at(-1) ?? b.term.value,
      start: b.start.value,
    })
  );
};
