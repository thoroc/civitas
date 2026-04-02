import { describe, expect, it, vi } from 'vitest';

import { buildKeyHandler, buildSeatInteractions } from './seatInteractions';

const makeSeat = (x = 10, y = 20) =>
  ({ x, y, member: { label: 'Test', party: null } as any }) as any;

const makeEvent = (key: string, extra: Partial<KeyboardEvent> = {}) =>
  ({ key, preventDefault: vi.fn(), ...extra }) as any;

describe('buildSeatInteractions', () => {
  it('show sets tooltip and focus when active', () => {
    const setTooltip = vi.fn();
    const setTooltipFade = vi.fn();
    const setFocusIndex = vi.fn();
    const setLockedIndex = vi.fn();
    const seat = makeSeat(5, 15);
    const { show } = buildSeatInteractions({
      inactive: false,
      index: 3,
      seat,
      lockedIndex: null,
      setTooltip,
      setTooltipFade,
      setFocusIndex,
      setLockedIndex,
    });
    show();
    expect(setTooltip).toHaveBeenCalledWith({
      x: 5,
      y: 15,
      i: 3,
      member: seat.member,
    });
    expect(setTooltipFade).toHaveBeenCalledWith(true);
    expect(setFocusIndex).toHaveBeenCalledWith(3);
  });

  it('show does nothing when inactive', () => {
    const setTooltip = vi.fn();
    const { show } = buildSeatInteractions({
      inactive: true,
      index: 0,
      seat: makeSeat(),
      lockedIndex: null,
      setTooltip,
      setTooltipFade: vi.fn(),
      setFocusIndex: vi.fn(),
      setLockedIndex: vi.fn(),
    });
    show();
    expect(setTooltip).not.toHaveBeenCalled();
  });

  it('hideIfUnlocked starts fade-out when not locked', () => {
    const setTooltipFade = vi.fn();
    const { hideIfUnlocked } = buildSeatInteractions({
      inactive: false,
      index: 2,
      seat: makeSeat(),
      lockedIndex: null, // not locked to index 2
      setTooltip: vi.fn(),
      setTooltipFade,
      setFocusIndex: vi.fn(),
      setLockedIndex: vi.fn(),
    });
    hideIfUnlocked();
    expect(setTooltipFade).toHaveBeenCalledWith(false);
  });

  it('hideIfUnlocked does nothing when locked to this seat', () => {
    const setTooltipFade = vi.fn();
    const { hideIfUnlocked } = buildSeatInteractions({
      inactive: false,
      index: 2,
      seat: makeSeat(),
      lockedIndex: 2, // locked to same index
      setTooltip: vi.fn(),
      setTooltipFade,
      setFocusIndex: vi.fn(),
      setLockedIndex: vi.fn(),
    });
    hideIfUnlocked();
    expect(setTooltipFade).not.toHaveBeenCalled();
  });

  it('toggleLock calls setLockedIndex toggler', () => {
    const setLockedIndex = vi.fn();
    const { toggleLock } = buildSeatInteractions({
      inactive: false,
      index: 1,
      seat: makeSeat(),
      lockedIndex: null,
      setTooltip: vi.fn(),
      setTooltipFade: vi.fn(),
      setFocusIndex: vi.fn(),
      setLockedIndex,
    });
    toggleLock();
    expect(setLockedIndex).toHaveBeenCalled();
    // the updater function should toggle: null → 1
    const updater = setLockedIndex.mock.calls[0][0];
    expect(updater(null)).toBe(1);
    expect(updater(1)).toBeNull();
  });
});

describe('buildKeyHandler', () => {
  const makeNav = () => ({
    moveFocus: vi.fn(),
    moveVertical: vi.fn((idx: number, dir: number) => idx + dir * 5),
  });

  it('does nothing when inactive', () => {
    const nav = makeNav();
    const handler = buildKeyHandler({
      index: 3,
      inactive: true,
      lockedIndex: null,
      tooltip: null,
      nav,
      setLockedIndex: vi.fn(),
      setLiveMessage: vi.fn(),
    });
    handler(makeEvent('ArrowRight'));
    expect(nav.moveFocus).not.toHaveBeenCalled();
  });

  it('ArrowRight moves focus forward', () => {
    const nav = makeNav();
    const handler = buildKeyHandler({
      index: 3,
      inactive: false,
      lockedIndex: null,
      tooltip: null,
      nav,
      setLockedIndex: vi.fn(),
      setLiveMessage: vi.fn(),
    });
    const e = makeEvent('ArrowRight');
    handler(e);
    expect(e.preventDefault).toHaveBeenCalled();
    expect(nav.moveFocus).toHaveBeenCalledWith(4, 1);
  });

  it('ArrowLeft moves focus backward', () => {
    const nav = makeNav();
    const handler = buildKeyHandler({
      index: 3,
      inactive: false,
      lockedIndex: null,
      tooltip: null,
      nav,
      setLockedIndex: vi.fn(),
      setLiveMessage: vi.fn(),
    });
    handler(makeEvent('ArrowLeft'));
    expect(nav.moveFocus).toHaveBeenCalledWith(2, -1);
  });

  it('Home moves to index 0', () => {
    const nav = makeNav();
    const e = makeEvent('Home');
    buildKeyHandler({
      index: 5,
      inactive: false,
      lockedIndex: null,
      tooltip: null,
      nav,
      setLockedIndex: vi.fn(),
      setLiveMessage: vi.fn(),
    })(e);
    expect(nav.moveFocus).toHaveBeenCalledWith(0, 1);
    expect(e.preventDefault).toHaveBeenCalled();
  });

  it('Enter toggles lock and announces message when tooltip present', () => {
    const setLockedIndex = vi.fn();
    const setLiveMessage = vi.fn();
    const e = makeEvent('Enter');
    buildKeyHandler({
      index: 2,
      inactive: false,
      lockedIndex: null,
      tooltip: { x: 0, y: 0, i: 2, member: {} as any },
      nav: makeNav(),
      setLockedIndex,
      setLiveMessage,
    })(e);
    expect(setLockedIndex).toHaveBeenCalled();
    expect(setLiveMessage).toHaveBeenCalled();
  });

  it('unknown key does nothing', () => {
    const nav = makeNav();
    buildKeyHandler({
      index: 0,
      inactive: false,
      lockedIndex: null,
      tooltip: null,
      nav,
      setLockedIndex: vi.fn(),
      setLiveMessage: vi.fn(),
    })(makeEvent('Tab'));
    expect(nav.moveFocus).not.toHaveBeenCalled();
  });
});
