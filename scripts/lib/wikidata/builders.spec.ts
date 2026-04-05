import { describe, expect, it } from 'vitest';

import { buildByElectionQuery } from './buildByElectionQuery.ts';
import { buildGeneralElectionQuery } from './buildGeneralElectionQuery.ts';
import { buildIdeologyQuery } from './buildIdeologyQuery.ts';
import { buildParliamentMembersQuery } from './buildParliamentMembersQuery.ts';
import { buildTermsQuery } from './buildTermsQuery.ts';
import { buildTermsQueryFallback } from './buildTermsQueryFallback.ts';
import { WIKIDATA_SPARQL_ENDPOINT } from './wikidataSparqlEndpoint.ts';

describe('WIKIDATA_SPARQL_ENDPOINT', () => {
  it('is a non-empty string URL', () => {
    expect(typeof WIKIDATA_SPARQL_ENDPOINT).toBe('string');
    expect(WIKIDATA_SPARQL_ENDPOINT.length).toBeGreaterThan(0);
    expect(WIKIDATA_SPARQL_ENDPOINT).toContain('wikidata');
  });
});

describe('buildTermsQuery', () => {
  it('returns a non-empty SPARQL string', () => {
    const q = buildTermsQuery();
    expect(typeof q).toBe('string');
    expect(q.length).toBeGreaterThan(0);
  });

  it('contains SELECT and WHERE clauses', () => {
    const q = buildTermsQuery();
    expect(q).toContain('SELECT');
    expect(q).toContain('WHERE');
  });

  it('targets UK Parliament (Q11005)', () => {
    expect(buildTermsQuery()).toContain('Q11005');
  });
});

describe('buildTermsQueryFallback', () => {
  it('returns a non-empty SPARQL string', () => {
    const q = buildTermsQueryFallback();
    expect(typeof q).toBe('string');
    expect(q.length).toBeGreaterThan(0);
  });

  it('contains SELECT and WHERE clauses', () => {
    const q = buildTermsQueryFallback();
    expect(q).toContain('SELECT');
    expect(q).toContain('WHERE');
  });
});

describe('buildGeneralElectionQuery', () => {
  it('includes general election QID', () => {
    const q = buildGeneralElectionQuery();
    expect(q).toContain('Q15283424');
  });

  it('returns a non-empty SPARQL string', () => {
    const q = buildGeneralElectionQuery();
    expect(typeof q).toBe('string');
    expect(q.length).toBeGreaterThan(0);
  });
});

describe('buildByElectionQuery', () => {
  it('includes UK parliamentary by-election QID', () => {
    const q = buildByElectionQuery();
    expect(q).toContain('Q7864918');
  });

  it('returns a non-empty SPARQL string', () => {
    const q = buildByElectionQuery();
    expect(typeof q).toBe('string');
    expect(q.length).toBeGreaterThan(0);
  });
});

describe('buildIdeologyQuery', () => {
  it('embeds each QID as wd:<qid> in VALUES', () => {
    const q = buildIdeologyQuery(['Q100', 'Q200']);
    expect(q).toContain('wd:Q100');
    expect(q).toContain('wd:Q200');
  });

  it('returns valid SPARQL for empty QID list', () => {
    const q = buildIdeologyQuery([]);
    expect(q).toContain('SELECT');
    expect(q).toContain('VALUES');
  });

  it('includes ideology and spectrum position predicates', () => {
    const q = buildIdeologyQuery(['Q1']);
    expect(q).toContain('wdt:P1142');
  });
});

describe('buildParliamentMembersQuery', () => {
  it('embeds the date string in the query', () => {
    const q = buildParliamentMembersQuery('2015-05-07T00:00:00Z', false);
    expect(q).toContain('2015-05-07T00:00:00Z');
  });

  it('includes Labour merge BIND when mergeLabourCoop is true', () => {
    const q = buildParliamentMembersQuery('2019-12-12T00:00:00Z', true);
    expect(q).toContain('Q6467393');
    expect(q).toContain('Q9630');
  });

  it('does not include merge BIND when mergeLabourCoop is false', () => {
    const q = buildParliamentMembersQuery('2019-12-12T00:00:00Z', false);
    expect(q).not.toContain('Q6467393');
  });

  it('contains SELECT and WHERE', () => {
    const q = buildParliamentMembersQuery('2021-01-01T00:00:00Z', false);
    expect(q).toContain('SELECT');
    expect(q).toContain('WHERE');
  });
});
