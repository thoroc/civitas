export interface Party {
  id: string; // QID
  label: string;
  color: string; // hex (no #) or CSS color
}

export interface Constituency {
  id: string;
  label: string;
}

export interface Member {
  id: string; // mp QID
  label: string;
  constituency: Constituency | null;
  party: Party | null;
  gender: string | null;
  age: number | null;
}

export interface ParliamentSnapshotMeta {
  date: string; // ISO date used for query
  generatedAt: string; // ISO timestamp when snapshot generated
  total: number;
}

export interface ParliamentSnapshot {
  meta: ParliamentSnapshotMeta;
  members: Member[];
}
