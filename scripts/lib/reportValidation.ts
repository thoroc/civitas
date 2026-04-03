import type { ValidationReport } from './validation.ts';

const logSample = (title: string, arr: string[]): void => {
  if (arr.length) {
    console.warn(`  ${title}:`);
    for (const msg of arr.slice(0, 10)) console.warn('    ', msg);
    if (arr.length > 10) console.warn('    ...');
  }
};

export const reportValidation = (
  partyValidation: ValidationReport,
  seatValidation: ValidationReport
): void => {
  const anyIssues = ['overlaps', 'negatives', 'gaps'].some(
    k =>
      (partyValidation as Record<string, string[]>)[k].length ||
      (seatValidation as Record<string, string[]>)[k].length
  );
  if (!anyIssues) return;
  console.warn(
    `[official][validate] party overlaps=${partyValidation.overlaps.length} negatives=${partyValidation.negatives.length} gaps=${partyValidation.gaps.length}`
  );
  console.warn(
    `[official][validate] seat  overlaps=${seatValidation.overlaps.length} negatives=${seatValidation.negatives.length} gaps=${seatValidation.gaps.length}`
  );
  logSample('party overlaps', partyValidation.overlaps);
  logSample('party negatives', partyValidation.negatives);
  logSample('party gaps', partyValidation.gaps);
  logSample('seat overlaps', seatValidation.overlaps);
  logSample('seat negatives', seatValidation.negatives);
  logSample('seat gaps', seatValidation.gaps);
};
