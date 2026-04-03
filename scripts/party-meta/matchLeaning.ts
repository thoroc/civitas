import { collectMatches } from './collectMatches.ts';
import type { Leaning, PartyMetaSourceInfo } from './types.ts';

interface LeaningResult {
  leaning: Leaning;
  matched: string[];
  method: PartyMetaSourceInfo['method'];
}

export const matchLeaning = (
  texts: string[],
  partyLabel: string
): LeaningResult => {
  const ideologyMatches: { leaning: Leaning; matches: string[] }[] = [];
  for (const leaning of ['left', 'center', 'right'] as Leaning[]) {
    const matches = texts.flatMap(t =>
      collectMatches(leaning, t.toLowerCase())
    );
    if (matches.length) ideologyMatches.push({ leaning, matches });
  }
  if (ideologyMatches.length) {
    ideologyMatches.sort((a, b) => b.matches.length - a.matches.length);
    const top = ideologyMatches[0];
    return {
      leaning: top.leaning,
      matched: top.matches,
      method: 'ideology-labels',
    };
  }
  const labelLC = partyLabel.toLowerCase();
  for (const leaning of ['left', 'right', 'center'] as Leaning[]) {
    const matches = collectMatches(leaning, labelLC);
    if (matches.length) {
      return { leaning, matched: matches, method: 'party-label-regex' };
    }
  }
  return { leaning: 'center', matched: [], method: 'fallback' };
};
