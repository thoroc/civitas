import { WBK } from 'wikibase-sdk';
import axios from 'axios';

const wdk = WBK({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql',
});

const getData = async (query: string) => {
  const url = wdk.sparqlQuery(query);

  // get response using axios
  return axios.get(url).then((response) => {
    return response.data;
  });
};

export interface Term {
  term: string;
  termLabel: string;
  start: string;
}

export const getTerms = (): Promise<Term[]> => {
  const sparQl = ` # put your SPARQL code between the backticks
SELECT ?term ?termLabel ?start WHERE {
  VALUES $PARLIAMENTS {wd:Q21094819 wd:Q21095053 }
  ?term wdt:P31 $PARLIAMENTS .
  ?term wdt:P580 ?start .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
ORDER BY ?start 
`;

  return getData(sparQl);
};

export interface Parlementarian {
  mp: string;
  mpLabel: string;
  constituency: string;
  constituencyLabel: string;
  partyTextLabel: string;
  genderLabel: string;
  rgb: string;
  age: number;
}

export const getParlementarians = (
  searchDate: string
): Promise<Parlementarian[]> => {
  const sparQl = ` # put your SPARQL code between the backticks  
SELECT ?mp ?mpLabel ?constituency ?constituencyLabel ?partyTextLabel ?genderLabel ?rgb (SAMPLE(?age) AS ?age) WITH { # sample used as some people more than one date of birth/death

SELECT ?parliament $DATE WHERE {
  VALUES $DATE { "${searchDate}"^^xsd:dateTime } 
  VALUES $PARL_TERMS {  wd:Q21094819  wd:Q21095053 }
  ?parliament wdt:P31 $PARL_TERMS .
  OPTIONAL { ?parliament wdt:P580 ?start_date }
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
  OPTIONAL {?term_stmt pq:P582 ?mp_end_date }
  BIND(IF(!BOUND(?mp_end_date), NOW(), ?mp_end_date) AS ?mp_end_date)
  FILTER (?mp_start_date <= $DATE && ?mp_end_date >= $DATE)
  BIND(IF(BOUND(?party), ?party, wd:Q24238356) AS ?party)
  OPTIONAL { ?party wdt:P465 ?rgb }
  BIND(IF(BOUND(?rgb), ?rgb, "808080") AS ?rgb)
  OPTIONAL { ?mp wdt:P21 ?gender }
  BIND(IF(BOUND(?gender), ?gender, wd:Q24238356) AS ?gender) 
  BIND ( IF (?party = wd:Q6467393 ,wd:Q9630, ?party) as ?partyText) # merge Labour Co-operative into Labour
  OPTIONAL { ?mp wdt:P569 ?dob }
  OPTIONAL { ?mp wdt:P570 ?dod }
  BIND(IF(BOUND(?dod), ?dod, NOW()) AS ?dod)
  BIND(?dod - ?dob AS ?ageInDays).
  BIND(?ageInDays/365.2425 AS ?ageInYears).
  BIND(FLOOR(?ageInYears) AS ?age).
  BIND(IF(BOUND(?age), ?age, 0) AS ?age) 
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
  } GROUP BY ?mp ?mpLabel ?constituency ?constituencyLabel ?partyTextLabel ?genderLabel ?rgb 
`; // put your SPARQL code between the backticks

  return getData(sparQl);
};
