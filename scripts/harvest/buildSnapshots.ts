import crypto from 'crypto';
import { Event, NormalizedData, Snapshot, SnapshotMember } from './schemas';

function hash(obj: any): string { return crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex').slice(0,10); }

interface ActiveState {
  party: string;
  partyName: string;
  constituency: string;
  constituencyName: string;
}

export interface BuildSnapshotsOptions {
  monthly?: boolean; // if true, also emit snapshots at month boundaries
}

export function buildSnapshots(normalized: NormalizedData, events: Event[], opts: BuildSnapshotsOptions = {}): Snapshot[] {
  const state = new Map<number, ActiveState>();

  // Seed initial state from latest spell before first event date (simplified: we only seed from spells starting before or on that date)
  const firstDate = events.length ? events[0].date : undefined;
  if (firstDate) {
    for (const ss of normalized.seatSpells) {
      if (ss.start <= firstDate && (!ss.end || ss.end >= firstDate)) {
        // find matching party at that date
        const p = normalized.partySpells.find(ps => ps.memberId === ss.memberId && ps.start <= firstDate && (!ps.end || ps.end >= firstDate));
        if (p) {
          state.set(ss.memberId, { party: p.partyId, partyName: p.partyName, constituency: ss.constituencyId, constituencyName: ss.constituencyName });
        }
      }
    }
  }

  const snapshots: Snapshot[] = [];

  function emit(date: string) {
    const members: SnapshotMember[] = [];
    for (const [memberId, s] of Array.from(state.entries())) {
      const ps = normalized.partySpells.find(p=>p.memberId===memberId && p.start <= date && (!p.end || p.end >= date));
      const ss = normalized.seatSpells.find(se=>se.memberId===memberId && se.start <= date && (!se.end || se.end >= date));
      members.push({ memberId, name: normalized.members.find(m=>m.memberId===memberId)?.name || String(memberId), constituencyId: s.constituency, constituencyName: s.constituencyName, partyId: s.party, partyName: s.partyName, provisional: !!(ps?.provisional || ss?.provisional) });
    }
    members.sort((a,b)=> a.memberId - b.memberId);
    const parties: Record<string, number> = {};
    for (const m of members) parties[m.partyId] = (parties[m.partyId]||0)+1;
    const snapshot: Snapshot = {
      date,
      meta: { generatedAt: new Date().toISOString(), source: { membersHash: hash(normalized.members), eventsHash: hash(events) } },
      members,
      parties,
      total: members.length,
    };
    snapshots.push(snapshot);
  }

  let currentMonth = firstDate ? firstDate.slice(0,7) : undefined;
  // Defer emitting first date until after applying first event to avoid duplicate when first event shares date.
 
  for (let idx=0; idx<events.length; idx++) {
    const ev = events[idx];
    switch (ev.type) {
      case 'generalElection': {
        // Rebuild full chamber composition: all members with active seat & party spells on election date.
        state.clear();
        for (const ss of normalized.seatSpells) {
          if (ss.start <= ev.date && (!ss.end || ss.end >= ev.date)) {
            const p = normalized.partySpells.find(ps => ps.memberId === ss.memberId && ps.start <= ev.date && (!ps.end || ps.end >= ev.date));
            if (p) {
              state.set(ss.memberId, { party: p.partyId, partyName: p.partyName, constituency: ss.constituencyId, constituencyName: ss.constituencyName });
            }
          }
        }
        break;
      }
      case 'byElection': {
        if (ev.memberId && ev.constituencyId) {
          const ss = normalized.seatSpells.find(s=>s.memberId===ev.memberId && s.constituencyId===ev.constituencyId && s.start===ev.date);
          const ps = normalized.partySpells.find(p=>p.memberId===ev.memberId && p.start<=ev.date && (!p.end||p.end>=ev.date));
          if (ss && ps) {
            state.set(ev.memberId, { party: ps.partyId, partyName: ps.partyName, constituency: ss.constituencyId, constituencyName: ss.constituencyName });
          }
        }
        break;
      }
      case 'partySwitch': {
        if (ev.memberId && ev.toPartyId) {
          const st = state.get(ev.memberId);
          if (st) {
            const ps = normalized.partySpells.find(p=>p.memberId===ev.memberId && p.partyId===ev.toPartyId && p.start===ev.date);
            if (ps) {
              st.party = ps.partyId; st.partyName = ps.partyName;
              state.set(ev.memberId, st);
            }
          }
        }
        break;
      }
      case 'vacancyStart': {
        if (ev.constituencyId) {
          for (const [mid, st] of Array.from(state.entries())) {
            if (st.constituency === ev.constituencyId) {
              state.delete(mid);
            }
          }
        }
        break;
      }
      case 'vacancyEnd': {
        // Handled by byElection or generalElection that will follow; ignore.
        break;
      }
    }
    emit(ev.date);

    if (opts.monthly) {
      const month = ev.date.slice(0,7);
      if (month !== currentMonth) {
        currentMonth = month;
        emit(month + '-01');
      }
    }
  }

  return snapshots;
}
