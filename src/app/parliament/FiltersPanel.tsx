'use client';
import ActiveFiltersSummary from './components/filters/ActiveFiltersSummary';
import AgeRangeFilter from './components/filters/AgeRangeFilter';
import FilterSection from './components/filters/FilterSection';
import GenderFilterList from './components/filters/GenderFilterList';
import PartyFilterList from './components/filters/PartyFilterList';
import { useParliamentFilters } from './filtersContext';
import { Member } from './types';

interface FiltersPanelProps {
  members: Member[];
}

const FiltersPanel = ({ members }: FiltersPanelProps) => {
  const { reset } = useParliamentFilters();

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

      <FilterSection title='Gender'>
        <GenderFilterList members={members} />
      </FilterSection>

      <FilterSection title='Age Range'>
        <AgeRangeFilter />
      </FilterSection>
    </div>
  );
};

export default FiltersPanel;
