export const buildParliamentMembersQuery = (
  date: string,
  mergeLabourCoop: boolean
): string => {
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
