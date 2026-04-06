'use client';
import { useMemo } from 'react';

import {
  ActiveFiltersSummary,
  AgeRangeFilter,
  FilterSection,
  GenderFilterList,
  PartyFilterList,
} from './components/filters';
import { useParliamentFilters } from './context/filters-context';
import type { Member } from './types';

interface FiltersPanelProps {
  members: Member[];
}

const FiltersPanel = ({ members }: FiltersPanelProps) => {
  const { reset } = useParliamentFilters();

  const hasGender = useMemo(
    () => members.some(m => m.gender !== null),
    [members]
  );
  const hasAge = useMemo(() => members.some(m => m.age !== null), [members]);

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-base font-semibold'>Filters</h2>
        <button
          type='button'
          className='btn btn-ghost btn-xs'
          onClick={() => reset()}
          aria-label='Reset all filters'
        >
          Reset
        </button>
      </div>

      <ActiveFiltersSummary members={members} />

      <FilterSection title='Parties'>
        <PartyFilterList members={members} />
      </FilterSection>

      {hasGender && (
        <FilterSection title='Gender'>
          <GenderFilterList members={members} />
        </FilterSection>
      )}

      {hasAge && (
        <FilterSection title='Age Range'>
          <AgeRangeFilter />
        </FilterSection>
      )}
    </div>
  );
};

export default FiltersPanel;
