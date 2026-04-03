import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/runTermsQuery.ts', () => ({ runTermsQuery: vi.fn() }));

import { runTermsQuery } from '../lib/runTermsQuery.ts';
import { fetchTermStartDates } from './fetchTermStartDates.ts';

const mockedQuery = vi.mocked(runTermsQuery);

describe('fetchTermStartDates', () => {
  beforeEach(() => mockedQuery.mockReset());

  it('returns terms from primary query when results are non-empty', async () => {
    mockedQuery.mockResolvedValueOnce([
      { term: 'Q1', start: '2010-05-01T00:00:00Z' },
    ]);
    const result = await fetchTermStartDates();
    expect(result).toEqual([{ term: 'Q1', start: '2010-05-01T00:00:00Z' }]);
    expect(mockedQuery).toHaveBeenCalledTimes(1);
  });

  it('falls back to secondary query when primary returns empty', async () => {
    mockedQuery
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ term: 'Q2', start: '2015-01-01T00:00:00Z' }]);
    const result = await fetchTermStartDates();
    expect(result).toEqual([{ term: 'Q2', start: '2015-01-01T00:00:00Z' }]);
    expect(mockedQuery).toHaveBeenCalledTimes(2);
  });

  it('returns empty array when both queries return empty', async () => {
    mockedQuery.mockResolvedValue([]);
    const result = await fetchTermStartDates();
    expect(result).toEqual([]);
    expect(mockedQuery).toHaveBeenCalledTimes(2);
  });

  it('filters out terms before MIN_DATE (2005-01-01)', async () => {
    mockedQuery.mockResolvedValueOnce([
      { term: 'Q1', start: '2004-12-31T00:00:00Z' },
      { term: 'Q2', start: '2005-01-01T00:00:00Z' },
      { term: 'Q3', start: '2010-06-01T00:00:00Z' },
    ]);
    const result = await fetchTermStartDates();
    expect(result).toHaveLength(2);
    expect(result.map(r => r.term)).toEqual(['Q2', 'Q3']);
  });

  it('passes "primary" and "fallback" labels to runTermsQuery', async () => {
    mockedQuery.mockResolvedValue([]);
    await fetchTermStartDates();
    expect(mockedQuery.mock.calls[0][1]).toBe('primary');
    expect(mockedQuery.mock.calls[1][1]).toBe('fallback');
  });
});
