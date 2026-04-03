import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./http.ts', () => ({ fetchWithRetry: vi.fn() }));

import { fetchWithRetry } from './http.ts';
import { runTermsQuery } from './runTermsQuery.ts';

const mockedFetch = vi.mocked(fetchWithRetry);

const makeResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe('runTermsQuery', () => {
  beforeEach(() => mockedFetch.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it('returns parsed TermStart array on success', async () => {
    mockedFetch.mockResolvedValueOnce(
      makeResponse({
        results: {
          bindings: [
            {
              term: { value: 'http://wd/Q123' },
              start: { value: '2010-01-01T00:00:00Z' },
            },
            {
              term: { value: 'http://wd/Q456' },
              start: { value: '2015-05-07T00:00:00Z' },
            },
          ],
        },
      })
    );
    const result = await runTermsQuery('SELECT...', 'test');
    expect(result).toEqual([
      { term: 'Q123', start: '2010-01-01T00:00:00Z' },
      { term: 'Q456', start: '2015-05-07T00:00:00Z' },
    ]);
  });

  it('returns empty array on non-OK HTTP status', async () => {
    mockedFetch.mockResolvedValueOnce(new Response(null, { status: 503 }));
    const result = await runTermsQuery('SELECT...', 'test');
    expect(result).toEqual([]);
  });

  it('returns empty array when bindings is not an array', async () => {
    mockedFetch.mockResolvedValueOnce(
      makeResponse({ results: { bindings: 'bad' } })
    );
    const result = await runTermsQuery('SELECT...', 'test');
    expect(result).toEqual([]);
  });

  it('returns empty array when bindings is empty', async () => {
    mockedFetch.mockResolvedValueOnce(
      makeResponse({ results: { bindings: [] } })
    );
    const result = await runTermsQuery('SELECT...', 'test');
    expect(result).toEqual([]);
  });

  it('returns empty array when results key is missing', async () => {
    mockedFetch.mockResolvedValueOnce(makeResponse({}));
    const result = await runTermsQuery('SELECT...', 'test');
    expect(result).toEqual([]);
  });

  it('uses the QID as term (last path segment)', async () => {
    mockedFetch.mockResolvedValueOnce(
      makeResponse({
        results: {
          bindings: [
            {
              term: { value: 'https://www.wikidata.org/wiki/Q999' },
              start: { value: '2019-12-12T00:00:00Z' },
            },
          ],
        },
      })
    );
    const [row] = await runTermsQuery('SELECT...', 'test');
    expect(row.term).toBe('Q999');
  });

  it('encodes query in URL', async () => {
    mockedFetch.mockResolvedValueOnce(
      makeResponse({ results: { bindings: [] } })
    );
    await runTermsQuery('SELECT ?x WHERE {}', 'test');
    const [calledUrl] = mockedFetch.mock.calls[0] as [string, ...unknown[]];
    expect(calledUrl).toContain(encodeURIComponent('SELECT ?x WHERE {}'));
  });
});
