import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useAppContext } from '../context/AppContext';
import type { Workout } from '../types';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

const sampleWorkout: Workout = {
  id: 'w-test-1',
  date: '2026-04-10',
  entries: [
    {
      id: 'entry-1',
      exerciseId: 'ex-push-001',
      sets: [{ setNumber: 1, reps: 5, weightKg: 80 }],
    },
  ],
  createdAt: '2026-04-10T12:00:00Z',
};

describe('AppContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('addWorkout', () => {
    it('adds a workout to the list', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      act(() => {
        result.current.addWorkout(sampleWorkout);
      });

      expect(result.current.appData.workouts).toHaveLength(1);
      expect(result.current.appData.workouts[0]).toEqual(sampleWorkout);
    });
  });

  describe('deleteWorkout', () => {
    it('removes a workout by id', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      act(() => {
        result.current.addWorkout(sampleWorkout);
      });
      expect(result.current.appData.workouts).toHaveLength(1);

      act(() => {
        result.current.deleteWorkout('w-test-1');
      });
      expect(result.current.appData.workouts).toHaveLength(0);
    });
  });

  describe('deleteExercise', () => {
    it('blocks deletion when exercise is referenced by a workout', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      // Add a workout that references ex-push-001
      act(() => {
        result.current.addWorkout(sampleWorkout);
      });

      let deleteResult: boolean = true;
      act(() => {
        deleteResult = result.current.deleteExercise('ex-push-001');
      });

      expect(deleteResult).toBe(false);
      // Exercise should still exist
      const exercise = result.current.appData.exercises.find(
        (e) => e.id === 'ex-push-001'
      );
      expect(exercise).toBeDefined();
    });

    it('succeeds when exercise is not referenced by any workout', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      // Add a custom exercise that is not used
      act(() => {
        result.current.addExercise({
          id: 'custom-1',
          name: 'Custom Exercise',
          category: 'core',
          isCustom: true,
        });
      });

      const initialCount = result.current.appData.exercises.length;

      let deleteResult: boolean = false;
      act(() => {
        deleteResult = result.current.deleteExercise('custom-1');
      });

      expect(deleteResult).toBe(true);
      expect(result.current.appData.exercises).toHaveLength(initialCount - 1);
      const deleted = result.current.appData.exercises.find(
        (e) => e.id === 'custom-1'
      );
      expect(deleted).toBeUndefined();
    });
  });
});
