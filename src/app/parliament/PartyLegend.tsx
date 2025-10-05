import { Member } from './types';

interface PartyLegendProps { members: Member[]; }
interface PartyInfo { id: string; label: string; color: string; count: number; }

const INDEPENDENT_ID = 'independent';
const INDEPENDENT_LABEL = 'Independent';
const INDEPENDENT_COLOR = '#808080';

const PartyLegend = ({ members }: PartyLegendProps) => {
  const partyMap = new Map<string, PartyInfo>();
  for (const m of members) {
    const id = m.party?.id || INDEPENDENT_ID;
    const label = m.party?.label || INDEPENDENT_LABEL;
    const color = m.party?.color || INDEPENDENT_COLOR;
    const existing = partyMap.get(id);
    if (existing) existing.count += 1; else partyMap.set(id, { id, label, color, count: 1 });
  }
  const parties = Array.from(partyMap.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return (
    <ul aria-label="Party legend" className="flex flex-col gap-1 text-sm">
      {parties.map(p => (
        <li key={p.id} className="flex items-center justify-between gap-3 group rounded-md px-2 py-1 hover:bg-base-200/80 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <span aria-hidden className="inline-block w-3 h-3 rounded-full border border-base-300 shrink-0" style={{ backgroundColor: p.color }} />
            <span className="truncate" title={p.label}>{p.label}</span>
          </div>
          <span className="text-xs text-muted tabular-nums">{p.count}</span>
        </li>
      ))}
    </ul>
  );
};

export default PartyLegend;
