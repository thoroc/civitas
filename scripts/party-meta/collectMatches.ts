import { KEYWORDS } from './keywords.ts';
import type { Leaning } from './types.ts';

export const collectMatches = (bucket: Leaning, source: string): string[] => {
  const res: string[] = [];
  for (const rx of KEYWORDS[bucket]) {
    if (rx.test(source)) res.push(rx.source);
  }
  return res;
};
