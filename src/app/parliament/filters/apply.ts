import { Member } from '../types';

export interface ParliamentFiltersState {
  parties: string[];
  genders: string[];
  minAge: number | null;
  maxAge: number | null;
}

export const defaultParliamentFiltersState: ParliamentFiltersState = {
  parties: [],
  genders: [],
  minAge: null,
  maxAge: null,
};

export type MemberPredicate = (m: Member) => boolean;

export const buildFilterPredicates = (
  f: ParliamentFiltersState
): MemberPredicate[] => {
  const preds: MemberPredicate[] = [];
  if (f.parties.length) {
    const parties = new Set(f.parties);
    preds.push(m => parties.has(m.party?.id || 'independent'));
  }
  if (f.genders.length) {
    const genders = new Set(f.genders);
    preds.push(m => !!m.gender && genders.has(m.gender));
  }
  if (f.minAge !== null) {
    const min = f.minAge;
    preds.push(m => (m.age ?? Infinity) >= min);
  }
  if (f.maxAge !== null) {
    const max = f.maxAge;
    preds.push(m => (m.age ?? -Infinity) <= max);
  }
  return preds;
};

export const applyFilters = (
  members: Member[],
  filters: ParliamentFiltersState
): Member[] => {
  const predicates = buildFilterPredicates(filters);
  if (!predicates.length) return members;
  return members.filter(m => predicates.every(p => p(m)));
};
