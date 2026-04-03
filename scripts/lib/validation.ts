export type TemporalSpell = { memberId: number; start: string; end?: string };
export type ValidationReport = {
  overlaps: string[];
  negatives: string[];
  gaps: string[];
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: spell validation logic is inherently branchy
export const validateSpells = <T extends TemporalSpell>(
  spells: T[]
): ValidationReport => {
  const byMember = new Map<number, T[]>();
  for (const s of spells) {
    if (!byMember.has(s.memberId)) byMember.set(s.memberId, []);
    byMember.get(s.memberId)?.push(s);
  }
  const overlaps: string[] = [];
  const negatives: string[] = [];
  const gaps: string[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  for (const [mid, arrRaw] of Array.from(byMember.entries())) {
    const arr = arrRaw.slice().sort((a, b) => a.start.localeCompare(b.start));
    for (const s of arr) {
      if (s.end && s.end < s.start) {
        negatives.push(`negative member=${mid} (${s.start}-${s.end})`);
      }
    }
    for (let i = 1; i < arr.length; i++) {
      const prev = arr[i - 1];
      const curr = arr[i];
      if (!prev.end || prev.end > curr.start) {
        overlaps.push(
          `overlap member=${mid} prev(${prev.start}-${prev.end ?? ''}) curr(${curr.start}-${curr.end ?? ''})`
        );
      } else if (prev.end < curr.start) {
        const gapDays = Math.round(
          (Date.parse(curr.start) - Date.parse(prev.end)) / dayMs
        );
        gaps.push(
          `gap member=${mid} prevEnd=${prev.end} nextStart=${curr.start} days=${gapDays}`
        );
      }
    }
  }
  return { overlaps, negatives, gaps };
};
