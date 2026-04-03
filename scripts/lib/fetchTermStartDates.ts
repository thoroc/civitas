import { runTermsQuery } from './runTermsQuery.ts';
import { buildTermsQuery, buildTermsQueryFallback } from './wikidata/index.ts';

export type { TermStart } from './runTermsQuery.ts';

const MIN_DATE = '2005-01-01T00:00:00Z';

export const fetchTermStartDates = async (): Promise<
  { term: string; start: string }[]
> => {
  let terms = await runTermsQuery(buildTermsQuery(), 'primary');
  if (terms.length === 0) {
    console.warn(
      '[terms] falling back to simplified query (no subclass traversal)'
    );
    terms = await runTermsQuery(buildTermsQueryFallback(), 'fallback');
  }
  if (terms.length === 0) {
    console.warn(
      '[terms] no term start dates resolved after retries + fallback'
    );
  }
  return terms.filter(r => r.start >= MIN_DATE);
};
