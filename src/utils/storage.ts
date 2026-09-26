import type { AppData } from '../types';
import { DEFAULT_PREFERENCES } from '../types';
import { defaultExercises } from '../data/defaultExercises';
import { mergeExerciseLibrary, loggedExerciseIds } from './exerciseLibrary';

const STORAGE_KEY = 'gym-tracker-data';

/**
 * Where a signed-in account's data is mirrored on the device.
 *
 * Kept under the account's own key, apart from the key above: that one is the
 * data of someone who never signed in, and is what a first sign-in migrates
 * up. Were the mirror written there too, signing a second account in on the
 * same phone would look like a migration and hand it the first one's history.
 */
function cacheKey(uid: string): string {
  return `${STORAGE_KEY}.${uid}`;
}

function getDefaultAppData(): AppData {
  return {
    exercises: defaultExercises,
    workouts: [],
    groups: [],
    preferences: { ...DEFAULT_PREFERENCES },
    deletedExerciseIds: [],
    renamedExerciseIds: [],
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
  return parseAppData(readRaw(STORAGE_KEY));
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseAppData(raw: string | null): AppData {
  try {
    if (!raw) {
      return getDefaultAppData();
    }
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      exercises: mergeExerciseLibrary(parsed.exercises, {
        deleted: parsed.deletedExerciseIds,
        renamed: parsed.renamedExerciseIds,
        keep: loggedExerciseIds(parsed.workouts),
      }),
      deletedExerciseIds: parsed.deletedExerciseIds ?? [],
      renamedExerciseIds: parsed.renamedExerciseIds ?? [],
      exerciseImages: parsed.exerciseImages ?? {},
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
  return writeAppData(STORAGE_KEY, data);
}

/**
 * The account's data as the device last saw it.
 *
 * An installed app is dropped by the system whenever it is in the background
 * long enough, and a relaunch with nothing on the device has to hold the whole
 * screen for a round trip before it can show anything at all. This is what it
 * opens on instead.
 */
export function loadCachedAppData(uid: string): AppData | null {
  const raw = readRaw(cacheKey(uid));
  return raw ? parseAppData(raw) : null;
}

export function saveCachedAppData(uid: string, data: AppData): void {
  writeAppData(cacheKey(uid), data);
}

export function clearCachedAppData(uid: string): void {
  try {
    localStorage.removeItem(cacheKey(uid));
  } catch {
    /* ignore */
  }
}

function writeAppData(key: string, data: AppData): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
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
