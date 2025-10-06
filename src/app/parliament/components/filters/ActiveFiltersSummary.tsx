'use client';
import { useMemo } from 'react';

import { useParliamentFilters } from '../../filtersContext';
import { Member } from '../../types';

interface ActiveFiltersSummaryProps {
  members: Member[];
}

// Shows a compact summary of active filters (counts & ranges)
// Logic is memoised to avoid recalculating on every render when inputs unchanged
const ActiveFiltersSummary = ({ members }: ActiveFiltersSummaryProps) => {
  const { filters } = useParliamentFilters();

  const summary = useMemo(() => {
    // Derive total unique parties & genders from current members list
    const partyIds = new Set<string>();
    const genders = new Set<string>();
    members.forEach(m => {
      partyIds.add(m.party?.id || 'independent');
      if (m.gender) genders.add(m.gender);
    });

    const totalParties = partyIds.size;
    const totalGenders = genders.size;

    const partyActive = filters.parties.length
      ? filters.parties.length
      : totalParties;
    const genderActive = filters.genders.length
      ? filters.genders.length
      : totalGenders;

    const ageActive = filters.minAge !== null || filters.maxAge !== null;

    return {
      partyActive,
      totalParties,
      genderActive,
      totalGenders,
      ageActive,
    };
  }, [
    members,
    filters.parties,
    filters.genders,
    filters.minAge,
    filters.maxAge,
  ]);

  const parts: string[] = [];
  parts.push(`${summary.partyActive}/${summary.totalParties} parties`);
  parts.push(`${summary.genderActive}/${summary.totalGenders} genders`);
  if (summary.ageActive) {
    const min = filters.minAge ?? 'min';
    const max = filters.maxAge ?? 'max';
    parts.push(`age ${min}-${max}`);
  }

  return (
    <div
      className='text-xs text-base-content/70 flex flex-wrap gap-2'
      aria-live='polite'
    >
      {parts.map(p => (
        <span
          key={p}
          className='inline-flex items-center rounded bg-base-200 px-2 py-0.5'
        >
          {p}
        </span>
      ))}
    </div>
  );
};

export default ActiveFiltersSummary;
