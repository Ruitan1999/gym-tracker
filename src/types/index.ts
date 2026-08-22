export interface Exercise {
  id: string;
  name: string;
  bodyPart: BodyPart;
  isCustom: boolean;
}

/**
 * What exercises were filed under before body parts: a movement pattern, which
 * says how a session is programmed rather than what it works. Only still here
 * so libraries stored under it can be carried across.
 */
export type LegacyExerciseCategory = 'push' | 'pull' | 'legs' | 'core' | 'cardio';

export type BodyPart =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'forearms'
  | 'core'
  | 'legs'
  | 'calves'
  | 'neck'
  | 'cardio';

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weightKg: number;
}

export interface WorkoutEntry {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
  done?: boolean;
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  name?: string;
  entries: WorkoutEntry[];
  notes?: string;
  createdAt: string; // ISO datetime
}

export interface UserPreferences {
  weightUnit: 'kg' | 'lb';
  quickReps: number[];
  weightStepKg: number;
  weightStepLb: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  weightUnit: 'kg',
  quickReps: [2, 4, 6, 8, 10],
  weightStepKg: 2.5,
  weightStepLb: 5,
};

export interface WorkoutGroup {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: string;
}

export interface AppData {
  exercises: Exercise[];
  workouts: Workout[];
  groups: WorkoutGroup[];
  preferences: UserPreferences;
  /**
   * Shipped exercises the owner has deleted. Without this the library can't
   * tell one they threw away from one they have simply never seen, and folds
   * it straight back in on the next load.
   */
  deletedExerciseIds?: string[];
  /**
   * Shipped exercises this owner has renamed. Their name wins over the
   * library's, so an admin correction elsewhere doesn't undo it.
   */
  renamedExerciseIds?: string[];
  dataVersion: number;
}
