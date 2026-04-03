import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockExistsSync, mockReadFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadFileSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  default: { existsSync: mockExistsSync, readFileSync: mockReadFileSync },
}));

import { loadOverrides } from './loadOverrides.ts';

describe('loadOverrides', () => {
  afterEach(() => vi.clearAllMocks());

  it('returns empty object when overrides file does not exist', () => {
    mockExistsSync.mockReturnValueOnce(false);
    expect(loadOverrides()).toEqual({});
  });

  it('returns parsed overrides when file exists', () => {
    mockExistsSync.mockReturnValueOnce(true);
    mockReadFileSync.mockReturnValueOnce(
      JSON.stringify({ Q1: { leaning: 'left' } })
    );
    expect(loadOverrides()).toEqual({ Q1: { leaning: 'left' } });
  });

  it('returns empty object when file is invalid JSON', () => {
    mockExistsSync.mockReturnValueOnce(true);
    mockReadFileSync.mockReturnValueOnce('not json {{');
    expect(loadOverrides()).toEqual({});
  });
});
