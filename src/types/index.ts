export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  isCustom: boolean;
}

export type ExerciseCategory = 'push' | 'pull' | 'legs' | 'core' | 'cardio';

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weightKg: number;
}

export interface WorkoutEntry {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
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
  dataVersion: number;
}
