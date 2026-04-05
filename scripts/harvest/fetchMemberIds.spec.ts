import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./cache');

import { cachedGet } from './cache';
import { fetchMemberIds } from './fetchMemberIds';

const cacheCfg = { dir: '/tmp/test', forceRefresh: false };

beforeEach(() => vi.clearAllMocks());

const makeSearchPage = (members: { id: number; name: string }[]) => ({
  value: {
    items: members.map(m => ({
      value: { id: m.id, nameDisplayAs: m.name },
      links: [],
    })),
    totalResults: members.length,
  },
});

describe('fetchMemberIds', () => {
  it('parses Parliament API response shape { value: { items, totalResults } }', async () => {
    vi.mocked(cachedGet).mockResolvedValueOnce(
      makeSearchPage([{ id: 1586, name: 'Adam Afriyie' }])
    );

    const members = await fetchMemberIds('https://example.com', 100, cacheCfg);

    expect(members).toEqual([{ memberId: 1586, name: 'Adam Afriyie' }]);
  });

  it('skips members with no ID', async () => {
    vi.mocked(cachedGet).mockResolvedValueOnce(
      makeSearchPage([
        { id: 0, name: 'Bad member' },
        { id: 42, name: 'Good member' },
      ])
    );

    const members = await fetchMemberIds('https://example.com', 100, cacheCfg);

    expect(members).toHaveLength(1);
    expect(members[0].memberId).toBe(42);
  });

  it('paginates until batch is smaller than pageSize', async () => {
    const page1 = makeSearchPage(
      Array.from({ length: 3 }, (_, i) => ({
        id: 100 + i,
        name: `M${100 + i}`,
      }))
    );
    const page2 = makeSearchPage([{ id: 200, name: 'M200' }]);
    vi.mocked(cachedGet)
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    const members = await fetchMemberIds('https://example.com', 3, cacheCfg);

    expect(members).toHaveLength(4);
    expect(cachedGet).toHaveBeenCalledTimes(2);
  });

  it('stops when items array is empty', async () => {
    vi.mocked(cachedGet).mockResolvedValueOnce({
      value: { items: [], totalResults: 0 },
    });

    const members = await fetchMemberIds('https://example.com', 100, cacheCfg);

    expect(members).toHaveLength(0);
  });
});
