'use client';
import FilterSection from './components/FilterSection';
import GenderFilterList from './components/GenderFilterList';
import PartyFilterList from './components/PartyFilterList';
import { useParliamentFilters } from './filtersContext';
import { Member } from './types';

interface FiltersPanelProps {
  members: Member[];
}

const FiltersPanel = ({ members }: FiltersPanelProps) => {
  const { filters, setFilters, reset } = useParliamentFilters();

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

      <FilterSection title='Parties'>
        <PartyFilterList members={members} />
      </FilterSection>

      <FilterSection title='Gender'>
        <GenderFilterList members={members} />
      </FilterSection>

      <FilterSection title='Age Range'>
        <div className='flex items-center gap-2'>
          <label className='text-xs flex flex-col'>
            Min
            <input
              type='number'
              className='input input-bordered input-xs w-20'
              value={filters.minAge ?? ''}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  minAge: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
            />
          </label>
          <label className='text-xs flex flex-col'>
            Max
            <input
              type='number'
              className='input input-bordered input-xs w-20'
              value={filters.maxAge ?? ''}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  maxAge: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
            />
          </label>
        </div>
      </FilterSection>
    </div>
  );
};

export default FiltersPanel;
