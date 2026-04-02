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
    label: 'M1',
    constituency: null,
    party: { id: 'A', label: 'A', color: '#000' },
    gender: 'female',
    age: 25,
  },
  {
    id: '2',
    label: 'M2',
    constituency: null,
    party: { id: 'B', label: 'B', color: '#111' },
    gender: 'male',
    age: 50,
  },
  {
    id: '3',
    label: 'M3',
    constituency: null,
    party: null,
    gender: null,
    age: null,
  },
];

describe('applyFilters additional cases', () => {
  it('returns empty when filter excludes all', () => {
    const out = applyFilters(members, {
      ...defaultParliamentFiltersState,
      parties: ['NON_EXISTENT'],
    });
    expect(out).toHaveLength(0);
  });

  it('minAge excludes null ages', () => {
    const out = applyFilters(members, {
      ...defaultParliamentFiltersState,
      minAge: 30,
    });
    // only member 2 (age 50) should match; member with null age is excluded
    expect(out.map(m => m.id)).toEqual(['2']);
  });

  it('predicates returned by buildFilterPredicates are functions and compose', () => {
    const preds = buildFilterPredicates({
      ...defaultParliamentFiltersState,
      genders: ['male'],
      maxAge: 60,
    });
    expect(preds.length).toBe(2);
    preds.forEach(p => expect(typeof p).toBe('function'));
    const manual = members.filter(m => preds.every(p => p(m)));
    const auto = applyFilters(members, {
      ...defaultParliamentFiltersState,
      genders: ['male'],
      maxAge: 60,
    });
    expect(manual).toEqual(auto);
  });
});
