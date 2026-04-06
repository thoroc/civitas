export const byStart = <T extends { start: string }>(a: T, b: T): number =>
  a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
