import { describe, expect, it } from 'vitest';

import type { Member } from '../types';

import {
  applyFilters,
  buildFilterPredicates,
  defaultParliamentFiltersState,
} from './apply';

const members: Member[] = [
  {
    id: '1',
    label: 'Member 1',
    constituency: null,
    party: { id: 'A', label: 'Alpha', color: '#FF0000' },
    gender: 'male',
    age: 40,
  },
  {
    id: '2',
    label: 'Member 2',
    constituency: null,
    party: { id: 'B', label: 'Beta', color: '#00FF00' },
    gender: 'female',
    age: 30,
  },
  {
    id: '3',
    label: 'Member 3',
    constituency: null,
    party: { id: 'A', label: 'Alpha', color: '#FF0000' },
    gender: null,
    age: null,
  },
  {
    id: '4',
    label: 'Member 4',
    constituency: null,
    party: null,
    gender: 'male',
    age: 70,
  },
];

describe('parliament filters apply', () => {
  it('returns all members when filters are default', () => {
    const out = applyFilters(members, defaultParliamentFiltersState);
    expect(out).toHaveLength(members.length);
  });

  it('filters by party', () => {
    const partyFiltered = applyFilters(members, {
      ...defaultParliamentFiltersState,
      parties: ['A'],
    });
    expect(partyFiltered).toHaveLength(2);
  });

  it('filters by gender', () => {
    const genderFiltered = applyFilters(members, {
      ...defaultParliamentFiltersState,
      genders: ['female'],
    });
    expect(genderFiltered).toHaveLength(1);
    expect(genderFiltered[0].id).toBe('2');
  });

  it('filters by minAge and maxAge', () => {
    const minAge = applyFilters(members, {
      ...defaultParliamentFiltersState,
      minAge: 35,
    });
    expect(minAge).toHaveLength(2);

    const maxAge = applyFilters(members, {
      ...defaultParliamentFiltersState,
      maxAge: 40,
    });
    expect(maxAge).toHaveLength(2);
    expect(maxAge.map(m => m.id)).toEqual(expect.arrayContaining(['1', '2']));
  });

  it('buildFilterPredicates matches applyFilters', () => {
    const preds = buildFilterPredicates({
      ...defaultParliamentFiltersState,
      parties: ['A'],
      genders: ['male'],
    });
    const manual = members.filter(m => preds.every(p => p(m)));
    const auto = applyFilters(members, {
      ...defaultParliamentFiltersState,
      parties: ['A'],
      genders: ['male'],
    });
    expect(manual).toHaveLength(auto.length);
  });
});
