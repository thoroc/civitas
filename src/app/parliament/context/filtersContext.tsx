'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from 'react';

import {
  ParliamentFiltersState,
  defaultParliamentFiltersState as defaultState,
  applyFilters,
} from '../filters/apply';
import { Member } from '../types';

interface ParliamentFiltersContextValue {
  filters: ParliamentFiltersState;
  setFilters: (
    u: (prev: ParliamentFiltersState) => ParliamentFiltersState
  ) => void;
  apply: (members: Member[]) => Member[];
  reset: () => void;
}

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

  const apply = useCallback(
    (members: Member[]) => applyFilters(members, filters),
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
