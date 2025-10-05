import { Member } from './types';

interface PartyLegendProps {
  members: Member[];
}

interface PartyInfo {
  id: string;
  label: string;
  color: string;
  count: number;
}

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
    if (existing) {
      existing.count += 1;
    } else {
      partyMap.set(id, { id, label, color, count: 1 });
    }
  }

  const parties = Array.from(partyMap.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return (
    <div aria-label="Party legend" className="flex flex-wrap gap-3 mt-4">
      {parties.map((p) => (
        <div
          key={p.id}
          role="listitem"
          className="flex items-center gap-1 text-sm bg-base-200 rounded px-2 py-1"
        >
          <span
            aria-hidden
            className="inline-block w-3 h-3 rounded-full border border-base-300"
            style={{ backgroundColor: p.color }}
          />
          <span>{p.label}</span>
          <span className="text-xs text-gray-500">({p.count})</span>
        </div>
      ))}
    </div>
  );
};

export default PartyLegend;
