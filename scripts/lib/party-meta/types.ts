export type Leaning = 'left' | 'center' | 'right';

export interface SnapshotMemberParty {
  id: string;
  label: string;
  color: string;
}

export interface SnapshotMember {
  party: SnapshotMemberParty | null;
}

export interface Snapshot {
  members: SnapshotMember[];
  meta?: { date?: string };
}

export interface PartyMetaSourceInfo {
  ideologies: string[];
  matched: string[];
  method: 'override' | 'ideology-labels' | 'party-label-regex' | 'fallback';
  generatedAt: string;
}

export interface PartyMetaRecord {
  id: string;
  label: string;
  color: string;
  leaning: Leaning;
  spectrumPosition: number;
  source: PartyMetaSourceInfo;
  originalSnapshotId: string;
  qidResolved: boolean;
}

export interface PartyEntry {
  id: string;
  label: string;
  color: string;
  resolvedQid?: string;
}
