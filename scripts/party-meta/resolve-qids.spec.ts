import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));

import axios from 'axios';
import { resolveQids } from './resolve-qids.ts';

const mockedGet = vi.mocked(axios.get);

describe('resolveQids', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedGet.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('skips parties that are already QIDs', async () => {
    const parties: Array<{ id: string; label: string; resolvedQid?: string }> =
      [{ id: 'Q123', label: 'Labour' }];
    const promise = resolveQids(parties);
    await vi.runAllTimersAsync();
    await promise;
    expect(mockedGet).not.toHaveBeenCalled();
    expect(parties[0].resolvedQid).toBeUndefined();
  });

  it('resolves QID for non-QID party via Wikidata search', async () => {
    mockedGet.mockResolvedValueOnce({ data: { search: [{ id: 'Q9630' }] } });
    const parties: Array<{ id: string; label: string; resolvedQid?: string }> =
      [{ id: 'lab', label: 'Labour Party' }];
    const promise = resolveQids(parties);
    await vi.runAllTimersAsync();
    await promise;
    expect(parties[0].resolvedQid).toBe('Q9630');
  });

  it('leaves resolvedQid undefined when no search result', async () => {
    mockedGet.mockResolvedValueOnce({ data: { search: [] } });
    const parties: Array<{ id: string; label: string; resolvedQid?: string }> =
      [{ id: 'xyz', label: 'Unknown Party' }];
    const promise = resolveQids(parties);
    await vi.runAllTimersAsync();
    await promise;
    expect(parties[0].resolvedQid).toBeUndefined();
  });

  it('leaves resolvedQid undefined when axios throws', async () => {
    mockedGet.mockRejectedValueOnce(new Error('network'));
    const parties: Array<{ id: string; label: string; resolvedQid?: string }> =
      [{ id: 'bad', label: 'Error Party' }];
    const promise = resolveQids(parties);
    await vi.runAllTimersAsync();
    await promise;
    expect(parties[0].resolvedQid).toBeUndefined();
  });

  it('processes multiple non-QID parties', async () => {
    mockedGet
      .mockResolvedValueOnce({ data: { search: [{ id: 'Q1' }] } })
      .mockResolvedValueOnce({ data: { search: [{ id: 'Q2' }] } });
    const parties: Array<{ id: string; label: string; resolvedQid?: string }> =
      [
        { id: 'a', label: 'Party A' },
        { id: 'b', label: 'Party B' },
      ];
    const promise = resolveQids(parties);
    await vi.runAllTimersAsync();
    await promise;
    expect(parties[0].resolvedQid).toBe('Q1');
    expect(parties[1].resolvedQid).toBe('Q2');
  });
});
