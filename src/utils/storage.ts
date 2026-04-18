import type { AppData } from '../types';
import { DEFAULT_PREFERENCES } from '../types';
import { defaultExercises } from '../data/defaultExercises';

const STORAGE_KEY = 'gym-tracker-data';

function getDefaultAppData(): AppData {
  return {
    exercises: defaultExercises,
    workouts: [],
    groups: [],
    preferences: { ...DEFAULT_PREFERENCES },
    dataVersion: 1,
  };
}

export function hasLocalAppData(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultAppData();
    }
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      exercises: parsed.exercises ?? defaultExercises,
      workouts: parsed.workouts ?? [],
      groups: parsed.groups ?? [],
      preferences: { ...DEFAULT_PREFERENCES, ...(parsed.preferences ?? {}) },
      dataVersion: parsed.dataVersion ?? 1,
    };
  } catch {
    return getDefaultAppData();
  }
}

export function saveAppData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded. Unable to save data.');
      return false;
    } else {
      throw error;
    }
  }
}

export function clearLocalAppData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
