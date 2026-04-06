import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./cache');

import { cachedGet } from './cache';
import { fetchMemberIds } from './fetch-member-ids';

const BASE = 'https://example.com';
const cacheCfg = { dir: '/tmp/test', forceRefresh: false };

beforeEach(() => vi.clearAllMocks());

const makeSearchPage = (
  members: { id: number; name: string }[],
  totalResults?: number
) => ({
  items: members.map(m => ({
    value: { id: m.id, nameDisplayAs: m.name },
    links: [],
  })),
  totalResults: totalResults ?? members.length,
  skip: 0,
  take: members.length,
});

describe('fetchMemberIds', () => {
  it('parses Parliament API response shape { items, totalResults }', async () => {
    vi.mocked(cachedGet).mockResolvedValueOnce(
      makeSearchPage([{ id: 1586, name: 'Adam Afriyie' }])
    );

    const members = await fetchMemberIds(BASE, cacheCfg);

    expect(members).toEqual([{ memberId: 1586, name: 'Adam Afriyie' }]);
  });

  it('skips members with no ID', async () => {
    vi.mocked(cachedGet).mockResolvedValueOnce(
      makeSearchPage([
        { id: 0, name: 'Bad member' },
        { id: 42, name: 'Good member' },
      ])
    );

    const members = await fetchMemberIds(BASE, cacheCfg);

    expect(members).toHaveLength(1);
    expect(members[0].memberId).toBe(42);
  });

  it('paginates using totalResults as termination condition', async () => {
    const page1 = makeSearchPage(
      [
        { id: 100, name: 'M100' },
        { id: 101, name: 'M101' },
      ],
      3
    );
    const page2 = makeSearchPage([{ id: 102, name: 'M102' }], 3);
    vi.mocked(cachedGet)
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    const members = await fetchMemberIds(BASE, cacheCfg);

    expect(members).toHaveLength(3);
    expect(cachedGet).toHaveBeenCalledTimes(2);
    // Second call should use skip=2 (items fetched so far)
    expect(cachedGet).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('skip=2'),
      cacheCfg
    );
  });

  it('stops when items array is empty', async () => {
    vi.mocked(cachedGet).mockResolvedValueOnce({ items: [], totalResults: 0 });

    const members = await fetchMemberIds(BASE, cacheCfg);

    expect(members).toHaveLength(0);
    expect(cachedGet).toHaveBeenCalledTimes(1);
  });

  it('does not include IsCurrentMember filter in search URL', async () => {
    vi.mocked(cachedGet).mockResolvedValueOnce(
      makeSearchPage([{ id: 1, name: 'MP' }])
    );

    await fetchMemberIds(BASE, cacheCfg);

    const url = vi.mocked(cachedGet).mock.calls[0][0] as string;
    expect(url).not.toContain('IsCurrentMember');
    expect(url).toContain('House=Commons');
  });
});
