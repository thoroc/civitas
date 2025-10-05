// Minimal general elections baseline (Commons) since 2005.
// Dates in ISO (YYYY-MM-DD) format.
export interface ElectionEvent { date: string; label: string; }
export const GENERAL_ELECTIONS: ElectionEvent[] = [
  { date: '2005-05-05', label: '2005 General Election' },
  { date: '2010-05-06', label: '2010 General Election' },
  { date: '2015-05-07', label: '2015 General Election' },
  { date: '2017-06-08', label: '2017 General Election' },
  { date: '2019-12-12', label: '2019 General Election' },
  // Future elections can be appended here.
];
