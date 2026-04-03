export const buildTermsQueryFallback = (): string => {
  return `SELECT ?term ?termLabel ?start WHERE {
    ?term wdt:P31 wd:Q15238777 ; wdt:P194 wd:Q11005 ; wdt:P580 ?start .
    OPTIONAL { ?term wdt:P582 ?end }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  } ORDER BY ?start`;
};
