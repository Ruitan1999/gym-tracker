import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type { AppData, Workout, Exercise, UserPreferences } from '../types';
import { loadAppData, saveAppData, clearLocalAppData, hasLocalAppData } from '../utils/storage';
import { loadRemoteAppData, saveRemoteAppData } from '../utils/remoteStorage';

interface AppContextValue {
  appData: AppData;
  loading: boolean;
  saveError: boolean;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  addExercise: (exercise: Exercise) => void;
  deleteExercise: (id: string) => boolean;
  updatePreferences: (preferences: UserPreferences) => void;
  showToast: (message: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
  uid?: string | null;
  showToast?: (message: string) => void;
}

export function AppProvider({ children, uid = null, showToast: externalToast }: AppProviderProps) {
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  const [loading, setLoading] = useState<boolean>(Boolean(uid));
  const [saveError, setSaveError] = useState(false);
  const hasLoadedRemoteRef = useRef(false);
  const skipNextSaveRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    if (!uid) {
      hasLoadedRemoteRef.current = false;
      skipNextSaveRef.current = true;
      setAppData(loadAppData());
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        const { data, existed } = await loadRemoteAppData(uid);

        let finalData = data;
        if (!existed && hasLocalAppData()) {
          const local = loadAppData();
          finalData = local;
          await saveRemoteAppData(uid, local);
          clearLocalAppData();
        }

        if (!cancelled) {
          skipNextSaveRef.current = true;
          setAppData(finalData);
          hasLoadedRemoteRef.current = true;
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load remote data:', err);
        if (!cancelled) {
          setLoading(false);
          setSaveError(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    if (uid) {
      if (!hasLoadedRemoteRef.current) return;
      let cancelled = false;
      (async () => {
        const ok = await saveRemoteAppData(uid, appData);
        if (!cancelled) setSaveError(!ok);
      })();
      return () => {
        cancelled = true;
      };
    }

    const success = saveAppData(appData);
    setSaveError(!success);
  }, [appData, uid]);

  const showToast = useCallback(
    (message: string) => {
      externalToast?.(message);
    },
    [externalToast]
  );

  const addWorkout = useCallback(
    (workout: Workout) => {
      setAppData((prev) => ({ ...prev, workouts: [...prev.workouts, workout] }));
      showToast('Workout saved!');
    },
    [showToast]
  );

  const updateWorkout = useCallback(
    (workout: Workout) => {
      setAppData((prev) => ({
        ...prev,
        workouts: prev.workouts.map((w) => (w.id === workout.id ? workout : w)),
      }));
      showToast('Workout updated!');
    },
    [showToast]
  );

  const deleteWorkout = useCallback(
    (id: string) => {
      setAppData((prev) => ({ ...prev, workouts: prev.workouts.filter((w) => w.id !== id) }));
      showToast('Workout deleted');
    },
    [showToast]
  );

  const addExercise = useCallback((exercise: Exercise) => {
    setAppData((prev) => ({ ...prev, exercises: [...prev.exercises, exercise] }));
  }, []);

  const deleteExercise = useCallback((id: string): boolean => {
    let blocked = false;
    setAppData((prev) => {
      const isUsed = prev.workouts.some((w) => w.entries.some((e) => e.exerciseId === id));
      if (isUsed) {
        blocked = true;
        return prev;
      }
      return { ...prev, exercises: prev.exercises.filter((e) => e.id !== id) };
    });
    return !blocked;
  }, []);

  const updatePreferences = useCallback((preferences: UserPreferences) => {
    setAppData((prev) => ({ ...prev, preferences }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        appData,
        loading,
        saveError,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        addExercise,
        deleteExercise,
        updatePreferences,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
