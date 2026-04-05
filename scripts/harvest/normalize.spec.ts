import { describe, expect, it } from 'vitest';

import { normalize } from './normalize.ts';

describe('normalize', () => {
  it('merges Labour & Co-operative, applies aliases, and filters by since', () => {
    const harvest = {
      members: [{ memberId: 1, name: 'Ada Lovelace' }],
      partySpells: [
        {
          memberId: 1,
          partyId: 'labour-coop',
          partyName: 'Labour Co-operative',
          start: '2004-01-01',
          end: '2004-12-31',
        },
        {
          memberId: 1,
          partyId: 'labour-coop',
          partyName: 'Labour Co-operative',
          start: '2010-01-01',
        },
      ],
      seatSpells: [
        {
          memberId: 1,
          constituencyId: 'alpha',
          constituencyName: 'Alpha',
          start: '2010-01-01',
        },
      ],
    };

    const cfg = {
      since: '2005-01-01',
      granularity: 'events' as const,
      mergeLabourCoop: true,
      forceRefresh: false,
      maxConcurrency: 4,
      cacheDir: '.cache',
      source: 'membersApi' as const,
      partyAliases: { labour_coop: 'labour' },
    };

    const normalized = normalize(harvest as never, cfg);

    expect(normalized.partySpells).toHaveLength(1);
    expect(normalized.partySpells[0]?.partyId).toBe('labour');
    expect(normalized.parties[0]?.partyId).toBe('labour');
    expect(normalized.constituencies[0]?.constituencyId).toBe('alpha');
  });
});
