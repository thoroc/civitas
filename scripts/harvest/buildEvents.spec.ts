import { describe, expect, it } from 'vitest';

import { buildEvents } from './buildEvents.ts';

const BASE_CFG = {
  since: '2005-01-01',
  granularity: 'events' as const,
  mergeLabourCoop: false,
  forceRefresh: false,
  maxConcurrency: 4,
  cacheDir: '.cache',
  source: 'membersApi' as const,
  partyAliases: {} as Record<string, string>,
};

describe('buildEvents', () => {
  it('builds ordered events for elections, seat changes, vacancies, and party switches', () => {
    const normalized = {
      members: [],
      parties: [],
      constituencies: [],
      seatSpells: [
        {
          memberId: 1,
          constituencyId: 'alpha',
          constituencyName: 'Alpha',
          start: '2010-01-01',
          end: '2011-01-01',
        },
        {
          memberId: 1,
          constituencyId: 'beta',
          constituencyName: 'Beta',
          start: '2011-02-01',
          end: '2012-01-01',
        },
        {
          memberId: 2,
          constituencyId: 'alpha',
          constituencyName: 'Alpha',
          start: '2011-02-01',
          end: '2013-01-01',
        },
      ],
      partySpells: [
        {
          memberId: 1,
          partyId: 'A',
          partyName: 'Party A',
          start: '2010-01-01',
          end: '2011-02-01',
        },
        {
          memberId: 1,
          partyId: 'B',
          partyName: 'Party B',
          start: '2011-02-01',
          end: '2012-01-01',
        },
      ],
    };

    const events = buildEvents(normalized as never, BASE_CFG, {
      elections: [{ date: '2010-01-01', label: '2010 GE' }],
    });

    const typesByDate = (date: string) =>
      events.filter(e => e.date === date).map(e => e.type);

    expect(typesByDate('2010-01-01')).toEqual(['generalElection']);
    expect(typesByDate('2011-01-01')).toEqual(['vacancyStart']);
    expect(typesByDate('2011-02-01')).toEqual([
      'vacancyEnd',
      'byElection',
      'byElection',
      'partySwitch',
      'seatChange',
    ]);
  });
});
