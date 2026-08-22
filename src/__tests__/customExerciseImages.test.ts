import { describe, it, expect, beforeEach } from 'vitest';
import { saveAppData, loadAppData } from '../utils/storage';
import { DEFAULT_PREFERENCES, type AppData } from '../types';

/**
 * Both load paths list the fields they carry over one by one, so a new field
 * that nobody added to them is dropped on the next load — quietly, and only
 * for people who already had data. That is what these cover.
 */
function appData(overrides: Partial<AppData> = {}): AppData {
  return {
    exercises: [{ id: 'mine-1', name: 'Sandbag Carry', bodyPart: 'core', isCustom: true }],
    workouts: [],
    groups: [],
    preferences: { ...DEFAULT_PREFERENCES },
    dataVersion: 1,
    ...overrides,
  };
}

beforeEach(() => localStorage.clear());

describe('a picture set on your own exercise', () => {
  it('is still there after a save and a load', () => {
    saveAppData(appData({ exerciseImages: { 'mine-1': 'https://cdn/mine-1.jpg' } }));
    expect(loadAppData().exerciseImages).toEqual({ 'mine-1': 'https://cdn/mine-1.jpg' });
  });

  it('comes back as an empty map for data written before pictures existed', () => {
    // Not undefined: every reader spreads it, and the app should not have to
    // guard a field that is simply empty.
    saveAppData(appData());
    expect(loadAppData().exerciseImages).toEqual({});
  });

  it('survives alongside an exercise renamed since', () => {
    saveAppData(appData({ exerciseImages: { 'mine-1': 'https://cdn/a.jpg' } }));
    const loaded = loadAppData();
    saveAppData({
      ...loaded,
      exercises: loaded.exercises.map((e) =>
        e.id === 'mine-1' ? { ...e, name: 'Sandbag Carry Heavy' } : e,
      ),
    });

    const again = loadAppData();
    expect(again.exerciseImages).toEqual({ 'mine-1': 'https://cdn/a.jpg' });
    expect(again.exercises.find((e) => e.id === 'mine-1')?.name).toBe('Sandbag Carry Heavy');
  });

  it('keeps the owner\'s exercise itself through the library merge', () => {
    // The merge drops entries the shipped library no longer has. One you made
    // up was never in it, so it has to be exempt or it would vanish.
    saveAppData(appData({ exerciseImages: { 'mine-1': 'https://cdn/a.jpg' } }));
    const loaded = loadAppData();
    expect(loaded.exercises.find((e) => e.id === 'mine-1')).toBeDefined();
  });
});
