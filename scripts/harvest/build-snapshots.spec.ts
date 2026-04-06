import { describe, expect, it } from 'vitest';

import { buildSnapshots } from './build-snapshots.ts';

describe('buildSnapshots', () => {
  it('classifies eventType using lookup data', () => {
    const normalized = {
      members: [{ memberId: 1, name: 'Ada Lovelace' }],
      parties: [],
      constituencies: [],
      seatSpells: [
        {
          memberId: 1,
          constituencyId: 'alpha',
          constituencyName: 'Alpha',
          start: '2019-12-12',
        },
      ],
      partySpells: [
        {
          memberId: 1,
          partyId: 'A',
          partyName: 'Party A',
          start: '2019-12-12',
        },
      ],
    };

    const events = [{ date: '2019-12-12', type: 'generalElection' }];

    const snapshots = buildSnapshots(normalized as never, events as never, {
      eventTypeLookup: {
        general: new Set(['2019-12-12']),
        byElection: new Set(),
      },
    });

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.eventType).toBe('general');
  });
});
