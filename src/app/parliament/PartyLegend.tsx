'use client';
import { useParliamentFilters } from './context/filtersContext';
import { Member } from './types';

interface PartyLegendProps {
  members: Member[];
}
interface PartyInfo {
  id: string;
  label: string;
  color: string;
  count: number;
  total: number;
}

const INDEPENDENT_ID = 'independent';
const INDEPENDENT_LABEL = 'Independent';
const INDEPENDENT_COLOR = '#808080';

const PartyLegend = ({ members }: PartyLegendProps) => {
  const { apply } = useParliamentFilters();
  const filtered = apply(members);

  // Build total map and filtered map for delta display
  const totalMap = new Map<string, PartyInfo>();
  for (const m of members) {
    const id = m.party?.id || INDEPENDENT_ID;
    const label = m.party?.label || INDEPENDENT_LABEL;
    const color = m.party?.color || INDEPENDENT_COLOR;
    const existing = totalMap.get(id);
    if (existing) existing.total += 1;
    else totalMap.set(id, { id, label, color, count: 0, total: 1 });
  }
  for (const m of filtered) {
    const id = m.party?.id || INDEPENDENT_ID;
    const pi = totalMap.get(id);
    if (pi) pi.count += 1;
  }
  const parties = Array.from(totalMap.values()).sort(
    (a, b) => b.total - a.total || a.label.localeCompare(b.label)
  );

  return (
    <ul aria-label='Party legend' className='flex flex-col gap-1 text-sm'>
      {parties.map(p => {
        const reduced = p.count !== p.total;
        return (
          <li
            key={p.id}
            className='flex items-center justify-between gap-3 group rounded-md px-2 py-1 hover:bg-base-200/80 transition-colors'
          >
            <div className='flex items-center gap-2 min-w-0'>
              <span
                aria-hidden
                className='inline-block w-3 h-3 rounded-full border border-base-300 shrink-0'
                style={{ backgroundColor: p.color }}
              />
              <span className='truncate' title={p.label}>
                {p.label}
              </span>
            </div>
            <span className='text-xs tabular-nums flex items-center gap-1'>
              <span
                className={reduced ? 'text-primary font-medium' : 'text-muted'}
              >
                {p.count}
              </span>
              <span className='text-muted/70'>/ {p.total}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default PartyLegend;
