/**
 * Converts colons to dashes for safe filesystem filenames.
 * e.g. 2021-01-01T00:00:00Z → 2021-01-01T00-00-00Z
 */
export const toSafeFilename = (isoDate: string): string =>
  isoDate.replace(/:/g, '-');
