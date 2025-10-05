export interface Party {
  id: string; // Wikidata QID (e.g. 'Q12345')
  label: string;
  color: string; // normalized CSS color (currently '#RRGGBB')
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
