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
}

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
