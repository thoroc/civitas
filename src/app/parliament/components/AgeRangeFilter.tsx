'use client';
import { useCallback } from 'react';

import { useParliamentFilters } from '../filtersContext';

const AgeRangeFilter = () => {
  const { filters, setFilters } = useParliamentFilters();

  const updateMin = useCallback(
    (value: string) => {
      setFilters(prev => ({
        ...prev,
        minAge: value === '' ? null : Number(value),
      }));
    },
    [setFilters]
  );

  const updateMax = useCallback(
    (value: string) => {
      setFilters(prev => ({
        ...prev,
        maxAge: value === '' ? null : Number(value),
      }));
    },
    [setFilters]
  );

  return (
    <div className='flex items-center gap-2'>
      <label className='text-xs flex flex-col'>
        Min
        <input
          type='number'
          className='input input-bordered input-xs w-20'
          value={filters.minAge ?? ''}
          onChange={e => updateMin(e.target.value)}
          aria-label='Minimum age'
          inputMode='numeric'
        />
      </label>
      <label className='text-xs flex flex-col'>
        Max
        <input
          type='number'
          className='input input-bordered input-xs w-20'
          value={filters.maxAge ?? ''}
          onChange={e => updateMax(e.target.value)}
          aria-label='Maximum age'
          inputMode='numeric'
        />
      </label>
    </div>
  );
};

export default AgeRangeFilter;
