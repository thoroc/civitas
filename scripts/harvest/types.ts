export type ISODate = string;

export interface PartySpell {
  memberId: number;
  partyId: string;
  partyName: string;
  start: ISODate;
  end?: ISODate;
  provisional?: boolean; // true if derived via fallback (no explicit history)
}

export interface SeatSpell {
  memberId: number;
  constituencyId: string;
  constituencyName: string;
  start: ISODate;
  end?: ISODate;
  provisional?: boolean; // true if derived via fallback (no explicit incumbency history)
}

export interface MemberCore {
  memberId: number;
  name: string;
  slug?: string;
  dateOfBirth?: ISODate;
}

export interface NormalizedData {
  members: MemberCore[];
  seatSpells: SeatSpell[];
  partySpells: PartySpell[];
  parties: { partyId: string; name: string }[];
  constituencies: { constituencyId: string; name: string }[];
}

export interface Event {
  date: ISODate;
  type: 'generalElection' | 'byElection' | 'partySwitch' | 'seatChange' | 'vacancyStart' | 'vacancyEnd';
  memberId?: number;
  constituencyId?: string;
  fromPartyId?: string;
  toPartyId?: string;
  note?: string;
}

export interface SnapshotMember {
  memberId: number;
  name: string;
  constituencyId: string;
  constituencyName: string;
  partyId: string;
  partyName: string;
  provisional?: boolean; // true if any underlying spell (seat or party) is provisional
}

export interface Snapshot {
  date: ISODate;
  meta: { generatedAt: ISODate; source: { membersHash: string; eventsHash: string } };
  members: SnapshotMember[];
  parties: Record<string, number>;
  total: number;
}

export interface HarvestConfig {
  since: ISODate;
  granularity: 'events' | 'monthly' | 'both';
  cacheDir: string;
  mergeLabourCoop: boolean;
  maxConcurrency: number;
  forceRefresh: boolean;
  partyAliases: Record<string, string>;
}
