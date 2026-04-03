import type { Leaning } from './types.ts';

export const KEYWORDS: Record<Leaning, RegExp[]> = {
  left: [
    /social/,
    /labou?r/,
    /green/,
    /social[- ]?democ/,
    /democratic socialism/,
    /progressive/,
    /ecologist/,
    /environmental/,
    /sinn/,
    /plaid/,
    /socialist/,
  ],
  right: [
    /conservative/,
    /unionist/,
    /libertarian/,
    /nationalist/,
    /right-?wing/,
    /reform/,
    /ukip/,
    /patriot/,
    /populis(t|m)/,
  ],
  center: [/liberal/, /centrist/, /christian[- ]?democ/, /moderate/],
};

export const spectrumMap: Record<Leaning, number> = {
  left: 0.25,
  center: 0.5,
  right: 0.75,
};
