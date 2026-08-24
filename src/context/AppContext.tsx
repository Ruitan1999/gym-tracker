import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type { AppData, Workout, Exercise, BodyPart, UserPreferences, WorkoutGroup } from '../types';
import type { SessionSavedStats } from '../components/shared/SessionSavedBanner';
import { loadAppData, saveAppData, clearLocalAppData, hasLocalAppData } from '../utils/storage';
import { loadRemoteAppData, saveRemoteAppData } from '../utils/remoteStorage';
import {
  isShippedExercise,
  mergeExerciseLibrary,
  loggedExerciseIds,
} from '../utils/exerciseLibrary';
import { loadLibraryOverrides } from '../utils/remoteLibrary';
import { prefetchImages, awaitImages } from '../utils/prefetchImages';
import { imageForExercise } from '../utils/exerciseImage';
import { usedExerciseIds } from '../utils/warmExerciseImages';
import {
  applyLibraryOverrides,
  EMPTY_OVERRIDES,
  type LibraryOverrides,
} from '../utils/libraryOverrides';

interface AppContextValue {
  appData: AppData;
  loading: boolean;
  saveError: boolean;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  addExercise: (exercise: Exercise) => void;
  renameExercise: (id: string, name: string) => void;
  updateCustomExercise: (id: string, patch: { bodyPart?: BodyPart; image?: string | null }) => void;
  deleteExercise: (id: string) => boolean;
  addGroup: (group: WorkoutGroup) => void;
  updateGroup: (group: WorkoutGroup) => void;
  deleteGroup: (id: string) => void;
  reorderGroups: (ids: string[]) => void;
  updatePreferences: (preferences: UserPreferences) => void;
  showToast: (message: string) => void;
  showSessionSaved: (stats: SessionSavedStats) => void;
  refreshAppData: () => Promise<void>;
  /** Admin-set pictures, which win over anything shipped with the app. */
  libraryImages: Record<string, string>;
  /** Every picture in effect for this account: admin-set, plus the owner's own. */
  exerciseImages: Record<string, string>;
  libraryOverrides: LibraryOverrides;
  /** Re-reads the admin layer after it has been changed. */
  reloadLibrary: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
  uid?: string | null;
  showToast?: (message: string) => void;
  showSessionSaved?: (stats: SessionSavedStats) => void;
}

/**
 * The pictures the first screen puts on screen straight away: the strips on
 * the template cards. Held for, rather than warmed behind, the loading screen.
 */
function firstScreenImages(data: AppData, images: Record<string, string>): (string | null)[] {
  const ids = new Set<string>();
  for (const group of data.groups ?? []) {
    for (const id of (group.exerciseIds ?? []).slice(0, 8)) ids.add(id);
  }
  return [...ids].map((id) => imageForExercise(id, images));
}

export function AppProvider({
  children,
  uid = null,
  showToast: externalToast,
  showSessionSaved: externalSessionSaved,
}: AppProviderProps) {
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  const [loading, setLoading] = useState<boolean>(Boolean(uid));
  const [saveError, setSaveError] = useState(false);
  const hasLoadedRemoteRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const [libraryImages, setLibraryImages] = useState<Record<string, string>>({});
  const [libraryOverrides, setLibraryOverrides] = useState<LibraryOverrides>(EMPTY_OVERRIDES);

  useEffect(() => {
    let cancelled = false;

    if (!uid) {
      hasLoadedRemoteRef.current = false;
      skipNextSaveRef.current = true;
      const local = loadAppData();
      setAppData(local);
      // Nothing to hold this screen for — local data is already in hand — so
      // the pictures are warmed behind it rather than ahead of it.
      prefetchImages(
        usedExerciseIds(local).map((id) => imageForExercise(id, local.exerciseImages ?? {})),
        160,
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        const [{ data, existed }, overrides] = await Promise.all([
          loadRemoteAppData(uid),
          loadLibraryOverrides(),
        ]);
        const applied = applyLibraryOverrides(overrides);

        let finalData = {
          ...data,
          exercises: mergeExerciseLibrary(data.exercises, {
            deleted: data.deletedExerciseIds,
            renamed: data.renamedExerciseIds,
            shipped: applied.exercises,
            keep: loggedExerciseIds(data.workouts),
          }),
        };
        if (!existed && hasLocalAppData()) {
          const local = loadAppData();
          finalData = local;
          await saveRemoteAppData(uid, local);
          clearLocalAppData();
        }

        if (!cancelled) {
          skipNextSaveRef.current = true;
          setLibraryOverrides(overrides);
          setLibraryImages(applied.images);
          setAppData(finalData);
          hasLoadedRemoteRef.current = true;
        }

        // Both before the loading screen lifts, not after it: warming that
        // starts once the home screen is already on screen only races the
        // pictures it was meant to have ready.
        const inEffect = { ...applied.images, ...(finalData.exerciseImages ?? {}) };
        prefetchImages(
          usedExerciseIds(finalData).map((id) => imageForExercise(id, inEffect)),
          160,
        );
        await awaitImages(firstScreenImages(finalData, inEffect));

        if (!cancelled) setLoading(false);
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

  const showSessionSaved = useCallback(
    (stats: SessionSavedStats) => {
      externalSessionSaved?.(stats);
    },
    [externalSessionSaved]
  );

  const addWorkout = useCallback((workout: Workout) => {
    setAppData((prev) => ({ ...prev, workouts: [...prev.workouts, workout] }));
  }, []);

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

  // Workouts and templates both reference an exercise by id, so a rename
  // follows through to everything already logged under the old name.
  const renameExercise = useCallback((id: string, name: string) => {
    setAppData((prev) => {
      // Remembered, or the library's own name wins it back on the next load.
      const renamed = prev.renamedExerciseIds ?? [];
      const remember = isShippedExercise(id) && !renamed.includes(id);
      return {
        ...prev,
        exercises: prev.exercises.map((e) => (e.id === id ? { ...e, name } : e)),
        ...(remember ? { renamedExerciseIds: [...renamed, id] } : {}),
      };
    });
  }, []);

  /**
   * Body part and picture for an exercise the owner made up themselves.
   *
   * Only theirs: for a shipped one the merge takes the library's body part on
   * every load, so a change here would quietly undo itself — that one belongs
   * on the admin screen, where it reaches everybody.
   */
  const updateCustomExercise = useCallback(
    (id: string, patch: { bodyPart?: BodyPart; image?: string | null }) => {
      setAppData((prev) => {
        const target = prev.exercises.find((e) => e.id === id);
        if (!target?.isCustom) return prev;

        const images = { ...(prev.exerciseImages ?? {}) };
        if (patch.image === null) delete images[id];
        else if (patch.image) images[id] = patch.image;

        return {
          ...prev,
          exercises: prev.exercises.map((e) =>
            e.id === id && patch.bodyPart ? { ...e, bodyPart: patch.bodyPart } : e,
          ),
          exerciseImages: images,
        };
      });
    },
    [],
  );

  const deleteExercise = useCallback((id: string): boolean => {
    let blocked = false;
    setAppData((prev) => {
      const isUsed = prev.workouts.some((w) => w.entries.some((e) => e.exerciseId === id));
      if (isUsed) {
        blocked = true;
        return prev;
      }
      // Remembered, or the next load folds it straight back in.
      const tombstones = prev.deletedExerciseIds ?? [];
      const remember = isShippedExercise(id) && !tombstones.includes(id);
      const images = { ...(prev.exerciseImages ?? {}) };
      delete images[id];
      return {
        ...prev,
        exercises: prev.exercises.filter((e) => e.id !== id),
        exerciseImages: images,
        ...(remember ? { deletedExerciseIds: [...tombstones, id] } : {}),
      };
    });
    return !blocked;
  }, []);

  /**
   * What every screen should actually draw. The owner's own pictures win: the
   * admin layer only knows about exercises everybody has, so anywhere the two
   * overlap it is this account that set the more specific one.
   */
  const exerciseImages = useMemo(
    () => ({ ...libraryImages, ...(appData.exerciseImages ?? {}) }),
    [libraryImages, appData.exerciseImages],
  );

  /**
   * Fetches the pictures this account will see, once, as soon as its data is
   * in. Without it every list pays for them the first time it is scrolled to,
   * which reads as the app loading again after it had finished loading.
   */
  const { groups: allGroups, workouts: allWorkouts } = appData;
  useEffect(() => {
    const ids = usedExerciseIds({ groups: allGroups, workouts: allWorkouts });
    if (ids.length === 0) return;
    return prefetchImages(
      ids.map((id) => imageForExercise(id, exerciseImages)),
      160,
    );
  }, [allGroups, allWorkouts, exerciseImages]);

  const updatePreferences = useCallback((preferences: UserPreferences) => {
    setAppData((prev) => ({ ...prev, preferences }));
  }, []);

  const addGroup = useCallback((group: WorkoutGroup) => {
    setAppData((prev) => ({ ...prev, groups: [...(prev.groups ?? []), group] }));
  }, []);

  const updateGroup = useCallback((group: WorkoutGroup) => {
    setAppData((prev) => ({
      ...prev,
      groups: (prev.groups ?? []).map((g) => (g.id === group.id ? group : g)),
    }));
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setAppData((prev) => ({
      ...prev,
      groups: (prev.groups ?? []).filter((g) => g.id !== id),
    }));
  }, []);

  const reloadLibrary = useCallback(async () => {
    const overrides = await loadLibraryOverrides();
    const applied = applyLibraryOverrides(overrides);
    setLibraryOverrides(overrides);
    setLibraryImages(applied.images);
    setAppData((prev) => ({
      ...prev,
      exercises: mergeExerciseLibrary(prev.exercises, {
        deleted: prev.deletedExerciseIds,
        renamed: prev.renamedExerciseIds,
        shipped: applied.exercises,
        keep: loggedExerciseIds(prev.workouts),
      }),
    }));
  }, []);

  const refreshAppData = useCallback(async () => {
    if (!uid) return;
    try {
      const { data } = await loadRemoteAppData(uid);
      skipNextSaveRef.current = true;
      setAppData(data);
      setSaveError(false);
    } catch (err) {
      console.error('Failed to refresh remote data:', err);
      setSaveError(true);
    }
  }, [uid]);

  const reorderGroups = useCallback((ids: string[]) => {
    setAppData((prev) => {
      const byId = new Map((prev.groups ?? []).map((g) => [g.id, g]));
      const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as WorkoutGroup[];
      return { ...prev, groups: ordered };
    });
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
        renameExercise,
        updateCustomExercise,
        deleteExercise,
        addGroup,
        updateGroup,
        deleteGroup,
        reorderGroups,
        updatePreferences,
        showToast,
        showSessionSaved,
        refreshAppData,
        libraryImages,
        exerciseImages,
        libraryOverrides,
        reloadLibrary,
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
