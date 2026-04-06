// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import useLiveAnnouncements from './use-live-announcements';

const makeMember = (id: string, label: string, partyLabel?: string) =>
  ({
    id,
    label,
    party: partyLabel ? { label: partyLabel } : undefined,
  }) as any;

describe('useLiveAnnouncements', () => {
  it('announces visible seat count when no tooltip and members exist', () => {
    const setLiveMessage = vi.fn();
    const members = [makeMember('1', 'Alice'), makeMember('2', 'Bob')];
    renderHook(() =>
      useLiveAnnouncements({
        tooltip: null,
        members,
        filteredMembers: members,
        setLiveMessage,
      })
    );
    expect(setLiveMessage).toHaveBeenCalledWith('2 of 2 seats visible');
  });

  it('announces filtered count correctly', () => {
    const setLiveMessage = vi.fn();
    const members = [
      makeMember('1', 'Alice'),
      makeMember('2', 'Bob'),
      makeMember('3', 'Carol'),
    ];
    const filteredMembers = [makeMember('1', 'Alice')];
    renderHook(() =>
      useLiveAnnouncements({
        tooltip: null,
        members,
        filteredMembers,
        setLiveMessage,
      })
    );
    expect(setLiveMessage).toHaveBeenCalledWith('1 of 3 seats visible');
  });

  it('does not announce seat count when tooltip is active', () => {
    const setLiveMessage = vi.fn();
    const members = [makeMember('1', 'Alice')];
    const tooltip = { i: 0, member: makeMember('1', 'Alice'), x: 0, y: 0 };
    renderHook(() =>
      useLiveAnnouncements({
        tooltip,
        members,
        filteredMembers: members,
        setLiveMessage,
      })
    );
    // Only the tooltip announcement should fire, not the seat count
    const countCalls = setLiveMessage.mock.calls.filter(
      c => typeof c[0] === 'string' && c[0].includes('seats visible')
    );
    expect(countCalls).toHaveLength(0);
  });

  it('announces focused seat with party when tooltip is set', () => {
    const setLiveMessage = vi.fn();
    const member = makeMember('1', 'Alice', 'Green Party');
    const tooltip = { i: 4, member, x: 0, y: 0 };
    renderHook(() =>
      useLiveAnnouncements({
        tooltip,
        members: [member],
        filteredMembers: [member],
        setLiveMessage,
      })
    );
    expect(setLiveMessage).toHaveBeenCalledWith('Seat 5: Alice, Green Party');
  });

  it('announces focused seat without party suffix when no party', () => {
    const setLiveMessage = vi.fn();
    const member = makeMember('1', 'Bob');
    const tooltip = { i: 0, member, x: 0, y: 0 };
    renderHook(() =>
      useLiveAnnouncements({
        tooltip,
        members: [member],
        filteredMembers: [member],
        setLiveMessage,
      })
    );
    expect(setLiveMessage).toHaveBeenCalledWith('Seat 1: Bob');
  });

  it('does not announce when members array is empty', () => {
    const setLiveMessage = vi.fn();
    renderHook(() =>
      useLiveAnnouncements({
        tooltip: null,
        members: [],
        filteredMembers: [],
        setLiveMessage,
      })
    );
    expect(setLiveMessage).not.toHaveBeenCalled();
  });
});
