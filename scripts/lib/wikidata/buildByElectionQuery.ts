export const buildByElectionQuery = (): string => {
  return `SELECT ?term ?termLabel ?start WHERE {
    ?term wdt:P31/wdt:P279* wd:Q7864918;
          wdt:P585 ?start.
    FILTER(BOUND(?start))
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  } ORDER BY ?start`;
};
