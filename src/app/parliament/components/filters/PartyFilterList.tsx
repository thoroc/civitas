'use client';
import { useMemo } from 'react';

import { useParliamentFilters } from '../../context/filtersContext';
import { Member } from '../../types';

import FilterBadge from './FilterBadge';

interface PartyFilterListProps {
  members: Member[];
}

const PartyFilterList = ({ members }: PartyFilterListProps) => {
  const { filters, setFilters } = useParliamentFilters();

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

  return (
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
  );
};

export default PartyFilterList;
