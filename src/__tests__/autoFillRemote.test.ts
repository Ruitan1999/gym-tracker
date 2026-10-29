import { describe, it, expect, vi } from 'vitest';
import { DEFAULT_PREFERENCES, type AppData } from '../types';

const store: { data: unknown } = { data: undefined };

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(async () => ({ exists: () => true, data: () => store.data })),
  setDoc: vi.fn(async (_ref: unknown, data: unknown) => {
    store.data = JSON.parse(JSON.stringify(data));
  }),
}));
vi.mock('../firebase/config', () => ({ db: {} }));

import { loadRemoteAppData, saveRemoteAppData } from '../utils/remoteStorage';

describe('autoFillFromLast in remote storage', () => {
  it('survives a save and a load', async () => {
    const data = {
      exercises: [],
      workouts: [],
      groups: [],
      preferences: { ...DEFAULT_PREFERENCES, autoFillFromLast: true },
      dataVersion: 1,
    } as AppData;
    expect(await saveRemoteAppData('u1', data)).toBe(true);
    const loaded = await loadRemoteAppData('u1');
    expect(loaded.data.preferences.autoFillFromLast).toBe(true);
  });

  it('stays off for an account that never set it', async () => {
    store.data = { preferences: { weightUnit: 'kg' } };
    const loaded = await loadRemoteAppData('u1');
    expect(loaded.data.preferences.autoFillFromLast).toBeUndefined();
  });
});
