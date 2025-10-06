'use client';
import { useMemo } from 'react';

import { useParliamentFilters } from '../filtersContext';
import { Member } from '../types';

import FilterBadge from './FilterBadge';

interface GenderFilterListProps {
  members: Member[];
}

const GenderFilterList = ({ members }: GenderFilterListProps) => {
  const { filters, setFilters } = useParliamentFilters();

  const genderOptions = useMemo(() => {
    const s = new Set<string>();
    members.forEach(m => {
      if (m.gender) s.add(m.gender);
    });
    return Array.from(s.values()).sort();
  }, [members]);

  return (
    <div className='flex flex-wrap gap-2'>
      {genderOptions.map(g => {
        const active = !filters.genders.length || filters.genders.includes(g);
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
  );
};

export default GenderFilterList;
