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
        preferences: { weightUnit: 'lb' },
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
  });

  describe('saveAppData', () => {
    it('returns true on success', () => {
      const data: AppData = {
        exercises: [],
        workouts: [],
        groups: [],
        preferences: { weightUnit: 'kg' },
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
        preferences: { weightUnit: 'lb' },
        dataVersion: 1,
      };

      saveAppData(data);
      const loaded = loadAppData();

      expect(loaded).toEqual(data);
    });
  });
});
