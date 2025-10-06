'use client';
import { useMemo } from 'react';

import FilterBadge from './components/FilterBadge';
import FilterSection from './components/FilterSection';
import { useParliamentFilters } from './filtersContext';
import { Member } from './types';

interface FiltersPanelProps {
  members: Member[];
}

const FiltersPanel = ({ members }: FiltersPanelProps) => {
  const { filters, setFilters, reset } = useParliamentFilters();

  const partyOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    members.forEach(m => {
      const id = m.party?.id || 'independent';
      const label = m.party?.label || 'Independent';
      if (!map.has(id)) map.set(id, { id, label });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [members]);

  const genderOptions = useMemo(() => {
    const s = new Set<string>();
    members.forEach(m => {
      if (m.gender) s.add(m.gender);
    });
    return Array.from(s.values()).sort();
  }, [members]);

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
        <div className='flex flex-wrap gap-2'>
          {partyOptions.map(p => {
            const active =
              !filters.parties.length || filters.parties.includes(p.id);
            return (
              <FilterBadge
                key={p.id}
                label={p.label}
                active={active}
                variant='primary'
                onToggle={() =>
                  setFilters(prev => {
                    const set = new Set(prev.parties);
                    if (active) {
                      if (!prev.parties.length) {
                        partyOptions.forEach(opt => set.add(opt.id));
                      }
                      set.delete(p.id);
                    } else {
                      set.add(p.id);
                    }
                    const arr = Array.from(set.values());
                    if (arr.length === partyOptions.length)
                      return { ...prev, parties: [] };
                    return { ...prev, parties: arr };
                  })
                }
              />
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title='Gender'>
        <div className='flex flex-wrap gap-2'>
          {genderOptions.map(g => {
            const active =
              !filters.genders.length || filters.genders.includes(g);
            return (
              <FilterBadge
                key={g}
                label={g}
                active={active}
                variant='secondary'
                onToggle={() =>
                  setFilters(prev => {
                    const set = new Set(prev.genders);
                    if (active) {
                      if (!prev.genders.length)
                        genderOptions.forEach(opt => set.add(opt));
                      set.delete(g);
                    } else {
                      set.add(g);
                    }
                    const arr = Array.from(set.values());
                    if (arr.length === genderOptions.length)
                      return { ...prev, genders: [] };
                    return { ...prev, genders: arr };
                  })
                }
              />
            );
          })}
        </div>
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
