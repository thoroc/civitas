export const buildIdeologyQuery = (qids: string[]): string => {
  return `SELECT ?party ?partyLabel ?ideology ?ideologyLabel WHERE { VALUES ?party { ${qids.map(q => `wd:${q}`).join(' ')} } OPTIONAL { ?party wdt:P1142 ?ideology . } OPTIONAL { ?party wdt:P1387 ?ideology . } SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". } }`;
};
