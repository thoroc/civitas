'use client';
import { ReactNode } from 'react';

interface FilterSectionProps {
  title: string;
  children: ReactNode;
}

const FilterSection = ({ title, children }: FilterSectionProps) => (
  <fieldset className='space-y-2'>
    <legend className='text-sm font-medium'>{title}</legend>
    {children}
  </fieldset>
);

export default FilterSection;
