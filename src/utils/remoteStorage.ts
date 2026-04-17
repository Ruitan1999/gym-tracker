import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { AppData } from '../types';
import { defaultExercises } from '../data/defaultExercises';

function getDefaultAppData(): AppData {
  return {
    exercises: defaultExercises,
    workouts: [],
    preferences: { weightUnit: 'kg' },
    dataVersion: 1,
  };
}

function userDocRef(uid: string) {
  if (!db) throw new Error('Firestore is not configured');
  return doc(db, 'users', uid);
}

export async function loadRemoteAppData(uid: string): Promise<{ data: AppData; existed: boolean }> {
  const ref = userDocRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { data: getDefaultAppData(), existed: false };
  }
  const raw = snap.data() as Partial<AppData>;
  return {
    existed: true,
    data: {
      exercises: raw.exercises ?? defaultExercises,
      workouts: raw.workouts ?? [],
      preferences: raw.preferences ?? { weightUnit: 'kg' },
      dataVersion: raw.dataVersion ?? 1,
    },
  };
}

export async function saveRemoteAppData(uid: string, data: AppData): Promise<boolean> {
  try {
    await setDoc(userDocRef(uid), data, { merge: false });
    return true;
  } catch (err) {
    console.error('Failed to save to Firestore:', err);
    return false;
  }
}
