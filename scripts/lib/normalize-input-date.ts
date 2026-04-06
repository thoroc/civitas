/**
 * Accepts either 2021-01-01T00-00-00Z (dashes) or 2021-01-01T00:00:00Z (colons).
 * Returns the ISO form with colons: 2021-01-01T00:00:00Z
 */
export const normalizeInputDate = (input: string): string => {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/.test(input)) {
    return input.replace(
      /^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})Z$/,
      '$1:$2:$3Z'
    );
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(input)) {
    return input;
  }
  console.error(
    'Unsupported date format. Use 2021-01-01T00-00-00Z or 2021-01-01T00:00:00Z'
  );
  process.exit(1);
};
