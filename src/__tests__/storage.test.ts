import { describe, it, expect, beforeEach } from 'vitest';
import { loadAppData, saveAppData } from '../utils/storage';
import { defaultExercises } from '../data/defaultExercises';
import type { AppData } from '../types';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadAppData', () => {
    it('returns default data with seed exercises when localStorage is empty', () => {
      const data = loadAppData();

      expect(data.exercises).toEqual(defaultExercises);
      expect(data.workouts).toEqual([]);
      expect(data.preferences.weightUnit).toBe('kg');
      expect(data.dataVersion).toBe(1);
    });

    it('returns stored data when localStorage has valid data', () => {
      const stored: AppData = {
        exercises: [{ id: 'custom-1', name: 'Custom Ex', category: 'push', isCustom: true }],
        workouts: [],
        groups: [],
        preferences: { weightUnit: 'lb', quickReps: [5, 8, 10], weightStepKg: 2.5, weightStepLb: 5 },
        dataVersion: 1,
      };
      localStorage.setItem('gym-tracker-data', JSON.stringify(stored));

      const data = loadAppData();

      expect(data.exercises).toEqual(stored.exercises);
      expect(data.preferences.weightUnit).toBe('lb');
    });

    it('returns defaults when localStorage has invalid JSON', () => {
      localStorage.setItem('gym-tracker-data', '{not valid json!!!');

      const data = loadAppData();

      expect(data.exercises).toEqual(defaultExercises);
      expect(data.workouts).toEqual([]);
      expect(data.preferences.weightUnit).toBe('kg');
    });

    it('fills missing preference fields with defaults when older data has only weightUnit', () => {
      const legacy = {
        exercises: defaultExercises,
        workouts: [],
        groups: [],
        preferences: { weightUnit: 'lb' },
        dataVersion: 1,
      };
      localStorage.setItem('gym-tracker-data', JSON.stringify(legacy));

      const data = loadAppData();

      expect(data.preferences.weightUnit).toBe('lb');
      expect(data.preferences.quickReps).toEqual([2, 4, 6, 8, 10]);
      expect(data.preferences.weightStepKg).toBe(2.5);
      expect(data.preferences.weightStepLb).toBe(5);
    });

    it('preserves custom quickReps and step values', () => {
      const stored: AppData = {
        exercises: defaultExercises,
        workouts: [],
        groups: [],
        preferences: { weightUnit: 'kg', quickReps: [3, 5, 8], weightStepKg: 1.25, weightStepLb: 2.5 },
        dataVersion: 1,
      };
      localStorage.setItem('gym-tracker-data', JSON.stringify(stored));

      const data = loadAppData();

      expect(data.preferences.quickReps).toEqual([3, 5, 8]);
      expect(data.preferences.weightStepKg).toBe(1.25);
      expect(data.preferences.weightStepLb).toBe(2.5);
    });
  });

  describe('saveAppData', () => {
    it('returns true on success', () => {
      const data: AppData = {
        exercises: [],
        workouts: [],
        groups: [],
        preferences: { weightUnit: 'kg', quickReps: [5, 6, 8, 10, 12, 15], weightStepKg: 2.5, weightStepLb: 5 },
        dataVersion: 1,
      };

      const result = saveAppData(data);

      expect(result).toBe(true);
    });

    it('round-trips: saveAppData then loadAppData returns the same data', () => {
      const data: AppData = {
        exercises: [
          { id: 'ex-1', name: 'Squat', category: 'legs', isCustom: false },
          { id: 'ex-2', name: 'My Exercise', category: 'core', isCustom: true },
        ],
        workouts: [
          {
            id: 'w-1',
            date: '2026-04-01',
            entries: [
              {
                id: 'e-1',
                exerciseId: 'ex-1',
                sets: [{ setNumber: 1, reps: 5, weightKg: 100 }],
              },
            ],
            notes: 'Great session',
            createdAt: '2026-04-01T10:00:00Z',
          },
        ],
        groups: [],
        preferences: { weightUnit: 'lb', quickReps: [5, 8, 10], weightStepKg: 2.5, weightStepLb: 5 },
        dataVersion: 1,
      };

      saveAppData(data);
      const loaded = loadAppData();

      expect(loaded).toEqual(data);
    });
  });
});
