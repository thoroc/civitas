'use client';

interface FilterBadgeProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  variant?: 'primary' | 'secondary' | 'neutral';
  size?: 'sm' | 'xs';
  className?: string;
  ariaLabel?: string;
}

const variantActiveClass: Record<string, string> = {
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  neutral: 'badge-neutral',
};

const sizeClassMap: Record<string, string> = {
  sm: 'badge-sm',
  xs: 'badge-xs',
};

const FilterBadge = ({
  label,
  active,
  onToggle,
  variant = 'neutral',
  size = 'sm',
  className = '',
  ariaLabel,
}: FilterBadgeProps) => {
  const activeClass = active ? variantActiveClass[variant] : 'badge-outline';
  const sizeClass = sizeClassMap[size];
  return (
    <button
      type='button'
      className={`badge ${sizeClass} cursor-pointer select-none ${activeClass} ${className}`}
      aria-pressed={active}
      aria-label={ariaLabel}
      onClick={onToggle}
    >
      {label}
    </button>
  );
};

export default FilterBadge;
