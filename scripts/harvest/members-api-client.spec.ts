import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HarvestConfig } from './schemas';

vi.mock('./cache');
vi.mock('./fetch-member-ids');
vi.mock('./extract-party-spells');
vi.mock('./extract-seat-spells');

import { cachedGet } from './cache';
import { extractPartySpells } from './extract-party-spells';
import { extractSeatSpells } from './extract-seat-spells';
import { fetchMemberIds } from './fetch-member-ids';
import { harvestMembers } from './members-api-client';

const cfg: HarvestConfig = {
  since: '2005-01-01',
  granularity: 'events',
  cacheDir: '/tmp/test-cache',
  mergeLabourCoop: false,
  forceRefresh: false,
  maxConcurrency: 1,
  partyAliases: {},
};

const mockMember = { memberId: 1586, name: 'Adam Afriyie' };

beforeEach(() => vi.clearAllMocks());

describe('harvestMembers', () => {
  it('delegates member fetching to fetchMemberIds', async () => {
    vi.mocked(fetchMemberIds).mockResolvedValue([mockMember]);
    vi.mocked(cachedGet).mockResolvedValue({});
    vi.mocked(extractPartySpells).mockReturnValue([]);
    vi.mocked(extractSeatSpells).mockReturnValue([]);

    const result = await harvestMembers(cfg);

    expect(fetchMemberIds).toHaveBeenCalledWith(
      'https://members-api.parliament.uk',
      { dir: cfg.cacheDir, forceRefresh: cfg.forceRefresh }
    );
    expect(result.members).toEqual([mockMember]);
  });

  it('fetches detail for each member and extracts spells', async () => {
    const detail = { value: { id: 1586 } };
    vi.mocked(fetchMemberIds).mockResolvedValue([mockMember]);
    vi.mocked(cachedGet).mockResolvedValue(detail);
    vi.mocked(extractPartySpells).mockReturnValue([
      {
        memberId: 1586,
        partyId: '4',
        partyName: 'Conservative',
        start: '2005-05-05T00:00:00',
      },
    ]);
    vi.mocked(extractSeatSpells).mockReturnValue([
      {
        memberId: 1586,
        constituencyId: '3855',
        constituencyName: 'Windsor',
        start: '2005-05-05T00:00:00',
        provisional: true,
      },
    ]);

    const result = await harvestMembers(cfg);

    expect(cachedGet).toHaveBeenCalledWith(
      'https://members-api.parliament.uk/api/Members/1586',
      expect.objectContaining({ dir: cfg.cacheDir })
    );
    expect(result.partySpells).toHaveLength(1);
    expect(result.seatSpells).toHaveLength(1);
  });

  it('handles detail fetch failure gracefully', async () => {
    vi.mocked(fetchMemberIds).mockResolvedValue([mockMember]);
    vi.mocked(cachedGet).mockRejectedValue(new Error('network error'));

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await harvestMembers(cfg);
    consoleSpy.mockRestore();

    expect(result.partySpells).toHaveLength(0);
    expect(result.seatSpells).toHaveLength(0);
  });
});
