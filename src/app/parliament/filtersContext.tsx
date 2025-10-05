"use client";
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { Member } from './types';

export interface ParliamentFiltersState {
  parties: string[]; // party ids to include (empty => all)
  genders: string[]; // genders to include (empty => all)
  minAge: number | null;
  maxAge: number | null;
}

interface ParliamentFiltersContextValue {
  filters: ParliamentFiltersState;
  setFilters: (u: (prev: ParliamentFiltersState) => ParliamentFiltersState) => void;
  apply: (members: Member[]) => Member[];
  reset: () => void;
}

const defaultState: ParliamentFiltersState = {
  parties: [],
  genders: [],
  minAge: null,
  maxAge: null,
};

const ParliamentFiltersContext = createContext<ParliamentFiltersContextValue | undefined>(undefined);

export const ParliamentFiltersProvider = ({ children }: { children: React.ReactNode }) => {
  const [filters, setFiltersInternal] = useState<ParliamentFiltersState>(defaultState);

  const setFilters = useCallback((updater: (prev: ParliamentFiltersState) => ParliamentFiltersState) => {
    setFiltersInternal(updater);
  }, []);

  const apply = useCallback((members: Member[]) => {
    return members.filter(m => {
      if (filters.parties.length && !filters.parties.includes(m.party?.id || 'independent')) return false;
      if (filters.genders.length && (!m.gender || !filters.genders.includes(m.gender))) return false;
      if (filters.minAge !== null && (m.age ?? Infinity) < filters.minAge) return false;
      if (filters.maxAge !== null && (m.age ?? -Infinity) > filters.maxAge) return false;
      return true;
    });
  }, [filters]);

  const reset = useCallback(() => setFiltersInternal(defaultState), []);

  const value = useMemo(() => ({ filters, setFilters, apply, reset }), [filters, setFilters, apply, reset]);

  return <ParliamentFiltersContext.Provider value={value}>{children}</ParliamentFiltersContext.Provider>;
};

export const useParliamentFilters = (): ParliamentFiltersContextValue => {
  const ctx = useContext(ParliamentFiltersContext);
  if (!ctx) throw new Error('useParliamentFilters must be used within ParliamentFiltersProvider');
  return ctx;
};
