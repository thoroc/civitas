'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from 'react';

import { Member } from '../types';

export interface ParliamentFiltersState {
  parties: string[]; // party ids to include (empty => all)
  genders: string[]; // genders to include (empty => all)
  minAge: number | null;
  maxAge: number | null;
}

interface ParliamentFiltersContextValue {
  filters: ParliamentFiltersState;
  setFilters: (
    u: (prev: ParliamentFiltersState) => ParliamentFiltersState
  ) => void;
  apply: (members: Member[]) => Member[];
  reset: () => void;
}

const defaultState: ParliamentFiltersState = {
  parties: [],
  genders: [],
  minAge: null,
  maxAge: null,
};

const ParliamentFiltersContext = createContext<
  ParliamentFiltersContextValue | undefined
>(undefined);

export const ParliamentFiltersProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [filters, setFiltersInternal] =
    useState<ParliamentFiltersState>(defaultState);

  const setFilters = useCallback(
    (updater: (prev: ParliamentFiltersState) => ParliamentFiltersState) => {
      setFiltersInternal(updater);
    },
    []
  );

  const buildPredicates = (f: ParliamentFiltersState) => {
    const preds: Array<(m: Member) => boolean> = [];
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

  const apply = useCallback(
    (members: Member[]) => {
      const predicates = buildPredicates(filters);
      if (!predicates.length) return members;
      return members.filter(m => predicates.every(p => p(m)));
    },
    [filters]
  );

  const reset = useCallback(() => setFiltersInternal(defaultState), []);

  const value = useMemo(
    () => ({ filters, setFilters, apply, reset }),
    [filters, setFilters, apply, reset]
  );

  return (
    <ParliamentFiltersContext.Provider value={value}>
      {children}
    </ParliamentFiltersContext.Provider>
  );
};

export const useParliamentFilters = (): ParliamentFiltersContextValue => {
  const ctx = useContext(ParliamentFiltersContext);
  if (!ctx)
    throw new Error(
      'useParliamentFilters must be used within ParliamentFiltersProvider'
    );
  return ctx;
};
