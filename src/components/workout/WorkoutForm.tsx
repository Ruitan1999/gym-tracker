import { useEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ExerciseSelect from '../shared/ExerciseSelect';
import DatePicker from '../shared/DatePicker';
import ConfirmModal from '../shared/ConfirmModal';
import EntryCard, { type SetsChange } from './EntryCard';
import heroIllustration from '../../assets/healthy-habit.svg';
import type { Workout, WorkoutEntry, WorkoutSet } from '../../types';
import { useDragReorder } from '../../utils/useDragReorder';
import { imageForExercise } from '../../utils/exerciseImage';
import { prefetchImages } from '../../utils/prefetchImages';
import type { TemplateOffer } from '../../utils/templateOffer';
import {
  DRAFT_KEY,
  type Draft,
  loadDraft,
  lastSetsFor,
  todayString,
  confirmEntry,
  confirmSet,
  isRecorded,
  isUnconfirmed,
  shiftAfterRemoval,
  startingSets,
  unconfirmedOf,
  type Unconfirmed,
} from '../../utils/templateSession';
import SessionStrip from './SessionStrip';
import RestTimer from './RestTimer';
import { useRestTimerCore } from '../../utils/useRestTimer';
import { useWakeLock } from '../../utils/useWakeLock';
import { bodyPartsOfTemplate } from '../../utils/bodyParts';
import { ratingColor } from '../../utils/rating';

interface WorkoutFormProps {
  existingWorkout?: Workout;
  autoOpenSelect?: boolean;
  /** Owned by the page, which renders it as the title you tap to rename. */
  name: string;
  onNameChange: (name: string) => void;
}

/**
 * Ordered, because a template hands its exercises to the next session in this
 * order — moving one is a change to what the template will produce.
 */
function sameExerciseIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

export { loadDraft };

export default function WorkoutForm({
  existingWorkout,
  autoOpenSelect,
  name,
  onNameChange,
}: WorkoutFormProps) {
  const {
    appData,
    loading,
    addWorkout,
    updateWorkout,
    showSessionSaved,
    exerciseImages,
  } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!existingWorkout;
  const isFocusedRoute = location.pathname === '/workout/new';

  const draft = !isEdit ? loadDraft() : null;

  const [date, setDate] = useState(existingWorkout?.date ?? draft?.date ?? todayString());
  // A workout that's already saved is finished by definition, so entries from
  // before `done` existed count as done — otherwise editing history is unsavable.
  const [entries, setEntries] = useState<WorkoutEntry[]>(
    existingWorkout?.entries.map((e) => ({ ...e, done: e.done ?? true })) ??
      draft?.entries ??
      [],
  );
  const [notes, setNotes] = useState(existingWorkout?.notes ?? draft?.notes ?? '');
  // Sets filled in from last time that the owner has not touched yet. Held
  // beside the entries rather than on them so it never reaches a saved workout.
  const [unconfirmed, setUnconfirmed] = useState<Unconfirmed>(
    () => (isEdit ? {} : (draft?.unconfirmed ?? {})),
  );
  // Only a session being lived is filled in; history being edited is left alone.
  const autoFill = !isEdit && !!appData.preferences.autoFillFromLast;
  const [showExerciseSelect, setShowExerciseSelect] = useState(
    () => !!autoOpenSelect && !existingWorkout,
  );
  const [hasStartedSession, setHasStartedSession] = useState(
    () => (existingWorkout?.entries?.length ?? draft?.entries?.length ?? 0) > 0,
  );
  const [startedAt, setStartedAt] = useState<string | null>(
    () => (isEdit ? (existingWorkout?.startedAt ?? null) : (draft?.startedAt ?? null)),
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    new Set(draft?.collapsedIds ?? []),
  );
  const [scrollToEntryId, setScrollToEntryId] = useState<string | null>(null);
  const [tappedChipId, setTappedChipId] = useState<string | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  // Editing history is never "started from a template" — the link only exists
  // for the session it was started in.
  const [sourceGroupId, setSourceGroupId] = useState<string | null>(
    () => (isEdit ? null : (draft?.sourceGroupId ?? null)),
  );

  // Rest and screen-awake only belong to a session being lived, not to history
  // being edited or the template picker that sits in front of one.
  const sessionLive = !isEdit && isFocusedRoute;
  const rest = useRestTimerCore();
  useWakeLock(sessionLive);

  // A list of expanded cards is impossible to reorder — one card fills the
  // screen. Everything folds for the drag and comes back as it was.
  const preDragCollapsedRef = useRef<Set<string> | null>(null);

  const {
    registerItem,
    handleLongPressDown,
    handleLongPressClickCapture,
    handleKeyDown,
    draggingId,
  } = useDragReorder({
    items: entries,
    getId: (e: WorkoutEntry) => e.id,
    onReorder: setEntries,
    onBeforeDrag: () => {
      if (preDragCollapsedRef.current) return;
      preDragCollapsedRef.current = collapsedIds;
      // Synchronous so the card is measured at its folded height, not the one
      // it had a frame ago.
      flushSync(() => setCollapsedIds(new Set(entries.map((e) => e.id))));
    },
    onAfterDrag: () => {
      const previous = preDragCollapsedRef.current;
      preDragCollapsedRef.current = null;
      if (previous) setCollapsedIds(previous);
    },
  });

  // Picking exercises only sets up empty sets — that's scaffolding, not work.
  // A session counts as underway once something has actually been recorded.
  // Numbers filled in from last time and not touched since are not work either.
  const hasLoggedWork = entries.some((e) =>
    e.sets.some((s, i) => isRecorded(s, unconfirmed, e.id, i)),
  );
  const hasAnyInput = hasLoggedWork || notes.trim().length > 0;

  // Tapping Start Workout lands here with the picker already up and nothing
  // behind it, so the sheet is the page rather than something layered over it.
  const pickerOpensEmptySession = isFocusedRoute && !isEdit && entries.length === 0;

  useEffect(() => {
    if (entries.length > 0 && !hasStartedSession) {
      setHasStartedSession(true);
    }
  }, [entries.length, hasStartedSession]);

  useEffect(() => {
    if (!scrollToEntryId) return;
    const el = document.querySelector(`[data-entry-id="${scrollToEntryId}"]`);
    if (el) {
      let scroller: HTMLElement | null = el.parentElement;
      while (scroller && scroller !== document.body) {
        const oy = getComputedStyle(scroller).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && scroller.scrollHeight > scroller.clientHeight) {
          break;
        }
        scroller = scroller.parentElement;
      }
      // Clear of the pinned strip, which sits over the top of the scroller.
      const stripH = stripRef.current?.offsetHeight ?? 0;
      const OFFSET = stripH > 0 ? stripH + 12 : 80;
      if (scroller && scroller !== document.body) {
        const elTop = el.getBoundingClientRect().top;
        const scTop = scroller.getBoundingClientRect().top;
        scroller.scrollTo({ top: scroller.scrollTop + (elTop - scTop) - OFFSET });
      } else {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - OFFSET });
      }
    }
    setScrollToEntryId(null);
  }, [scrollToEntryId]);

  useEffect(() => {
    if (isEdit) return;
    // Only a session with something recorded is worth restoring. Keeping the
    // exercise picks alone meant an abandoned session came back the next time
    // you tapped Start Workout, and left a bare date behind that silently
    // carried into the following one.
    if (!hasAnyInput) {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }
    const payload: Draft = {
      date,
      name,
      entries,
      notes,
      collapsedIds: [...collapsedIds],
      ...(sourceGroupId ? { sourceGroupId } : {}),
      ...(startedAt ? { startedAt } : {}),
      ...(Object.keys(unconfirmed).length > 0 ? { unconfirmed } : {}),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  }, [
    isEdit,
    date,
    name,
    entries,
    notes,
    collapsedIds,
    hasAnyInput,
    sourceGroupId,
    startedAt,
    unconfirmed,
  ]);

  const groups = appData.groups ?? [];

  // Every picture a template could ask for, fetched while its card is still
  // sitting there — so starting one has nothing left to wait on.
  useEffect(() => {
    if (groups.length === 0) return;
    const ids = new Set(groups.flatMap((g) => g.exerciseIds));
    return prefetchImages([...ids].map((id) => imageForExercise(id, exerciseImages)));
    // groups is rebuilt each render; its contents are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData.groups, exerciseImages]);
  // Undefined once the template has been deleted mid-session, which just falls
  // back to the ordinary save-as-template flow.
  const sourceGroup = sourceGroupId ? groups.find((g) => g.id === sourceGroupId) : undefined;

  // The session being edited is not its own history: what it holds right now is
  // what is on screen, so "last time" has to mean the one before it.
  function getLastWorkoutSets(exerciseId: string): WorkoutSet[] | null {
    const earlier = existingWorkout
      ? appData.workouts.filter((w) => w.id !== existingWorkout.id)
      : appData.workouts;
    return lastSetsFor(earlier, exerciseId);
  }

  function navigateHomeAndScrollTop() {
    navigate('/');
    requestAnimationFrame(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTop = 0;
      window.scrollTo({ top: 0 });
    });
  }

  /**
   * A finished session opens its own page, so the work just done is the thing
   * on screen rather than something to go looking for.
   *
   * Replacing rather than pushing: the session form is finished with, and
   * leaving it in the history would put a spent, empty form behind the back
   * button instead of the home page.
   */
  function navigateToSession(workoutId: string, offer?: TemplateOffer) {
    navigate(`/history/${workoutId}`, {
      replace: true,
      ...(offer ? { state: { offerTemplate: offer } } : {}),
    });
  }

  function discardWorkout() {
    localStorage.removeItem(DRAFT_KEY);
    setEntries([]);
    setUnconfirmed({});
    onNameChange('');
    setNotes('');
    setCollapsedIds(new Set());
    setSourceGroupId(null);
    setStartedAt(null);
    setShowCancelConfirm(false);
    navigateHomeAndScrollTop();
  }

  function handleCancel() {
    // Nothing recorded means nothing to lose — don't make them confirm.
    if (entries.length > 0 && hasAnyInput) {
      setShowCancelConfirm(true);
      return;
    }
    discardWorkout();
  }

  function handleSelectExercise(exerciseId: string) {
    const lastSets = getLastWorkoutSets(exerciseId);
    const sets: WorkoutSet[] = startingSets(lastSets, autoFill);
    const newEntry: WorkoutEntry = {
      id: crypto.randomUUID(),
      exerciseId,
      sets,
    };
    if (autoFill) setUnconfirmed((prev) => ({ ...prev, ...unconfirmedOf([newEntry]) }));
    setCollapsedIds(new Set(entries.map((e) => e.id)));
    setEntries((prev) => [...prev, newEntry]);
    setShowExerciseSelect(false);
    setScrollToEntryId(newEntry.id);
    beginSession();
  }

  /** The clock starts once and is never restarted by a later exercise. */
  function beginSession() {
    if (!isEdit) setStartedAt((prev) => prev ?? new Date().toISOString());
  }

  function toggleCollapsed(entryId: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  }

  // Opens the card it names and brings it up; the others stay as they are.
  function handleChipSelect(entryId: string) {
    setTappedChipId(entryId);
    setCollapsedIds((prev) => {
      if (!prev.has(entryId)) return prev;
      const next = new Set(prev);
      next.delete(entryId);
      return next;
    });
    setScrollToEntryId(entryId);
  }

  function handleSetsChange(entryIndex: number, sets: WorkoutSet[], change?: SetsChange) {
    // There is no per-set tick: sets arrive pre-sized and empty, and a set
    // counts as done once its reps go from nothing to something. That is the
    // moment rest begins; fixing a number later, changing load or adding or
    // removing a set does not restart it.
    const entryId = entries[entryIndex]?.id;
    if (sessionLive) {
      const before = entries[entryIndex]?.sets ?? [];
      if (sets.length === before.length && sets.some((s, i) => s.reps > 0 && !(before[i].reps > 0))) {
        rest.start();
      } else if (
        // A set filled in from last time already has reps, so nothing goes from
        // empty to something. The first touch is when it becomes logged.
        sets.length === before.length &&
        change?.touched !== undefined &&
        entryId !== undefined &&
        isUnconfirmed(unconfirmed, entryId, change.touched) &&
        sets[change.touched].reps > 0
      ) {
        rest.start();
      }
    }
    if (entryId !== undefined && change) {
      const { touched, removed } = change;
      if (removed !== undefined) setUnconfirmed((prev) => shiftAfterRemoval(prev, entryId, removed));
      else if (touched !== undefined) setUnconfirmed((prev) => confirmSet(prev, entryId, touched));
    }
    setEntries((prev) => prev.map((e, i) => (i === entryIndex ? { ...e, sets } : e)));
  }

  function handleRemoveEntry(entryIndex: number) {
    const gone = entries[entryIndex];
    if (gone) setUnconfirmed((prev) => confirmEntry(prev, gone.id));
    setEntries((prev) => prev.filter((_, i) => i !== entryIndex));
  }

  // Completing an exercise is the moment you're done looking at it, so it folds
  // away and the next one comes up to meet you. Undoing opens it back up.
  function handleToggleDone(entryIndex: number) {
    const entry = entries[entryIndex];
    if (!entry) return;
    const nextDone = !entry.done;
    // The last set already started a rest; finishing the exercise only starts
    // one when nothing is counting, so it never resets a rest part-way.
    if (sessionLive && nextDone && rest.phase === 'idle') rest.start();
    // Calling the exercise done is the owner's say-so on every set in it.
    if (nextDone) setUnconfirmed((prev) => confirmEntry(prev, entry.id));
    setEntries((prev) => prev.map((e, i) => (i === entryIndex ? { ...e, done: nextDone } : e)));
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (nextDone) next.add(entry.id);
      else next.delete(entry.id);
      return next;
    });
  }


  function exerciseIdsMatchExistingGroup(ids: string[]): boolean {
    const target = new Set(ids);
    return groups.some(
      (g) =>
        g.exerciseIds.length === target.size &&
        g.exerciseIds.every((id) => target.has(id)),
    );
  }

  /**
   * Saves the session and leaves for it.
   *
   * The template question used to stand in front of this: the workout was held
   * pending until the prompt was answered, so pressing Save Session saved
   * nothing by itself and any way out of that prompt that wasn't one of its
   * buttons lost the session. The session is finished the moment it is saved —
   * what becomes of the template is a separate question, and it is now asked
   * on the other side of the save, over the session it is about.
   */
  function commitWorkout(workout: Workout, offer?: TemplateOffer) {
    addWorkout(workout);
    const sets = workout.entries.reduce((a, e) => a + e.sets.length, 0);
    const reps = workout.entries.reduce(
      (a, e) => a + e.sets.reduce((s, set) => s + (set.reps || 0), 0),
      0,
    );
    const volumeKg = workout.entries.reduce(
      (a, e) => a + e.sets.reduce((s, set) => s + set.reps * set.weightKg, 0),
      0,
    );
    showSessionSaved({
      exercises: workout.entries.length,
      sets,
      reps,
      volumeKg,
    });
    localStorage.removeItem(DRAFT_KEY);
    navigateToSession(workout.id, offer);
  }

  function handleSave() {
    setValidationError('');
    if (entries.length === 0) {
      setValidationError('Add at least one exercise.');
      return;
    }
    const hasValidSet = entries.some((entry) => entry.sets.some((s) => s.reps > 0));
    if (!hasValidSet) {
      setValidationError('At least one set must have reps greater than 0.');
      return;
    }
    if (pendingCount > 0) {
      setValidationError(
        `Mark ${pendingCount === 1 ? 'the last exercise' : `all ${pendingCount} remaining exercises`} done before saving.`,
      );
      return;
    }
    const trimmedName = name.trim();
    if (isEdit && existingWorkout) {
      const updated: Workout = {
        ...existingWorkout,
        date,
        entries,
        ...(trimmedName ? { name: trimmedName } : {}),
        ...(notes ? { notes } : {}),
      };
      if (!trimmedName) delete (updated as Partial<Workout>).name;
      if (!notes) delete (updated as Partial<Workout>).notes;
      updateWorkout(updated);
      localStorage.removeItem(DRAFT_KEY);
      navigateToSession(updated.id);
      return;
    }
    const savedEntries = entries;
    const workout: Workout = {
      id: crypto.randomUUID(),
      date,
      ...(trimmedName ? { name: trimmedName } : {}),
      entries: savedEntries,
      ...(notes ? { notes } : {}),
      ...(startedAt ? { startedAt } : {}),
      createdAt: new Date().toISOString(),
    };

    const exerciseIds = savedEntries.map((e) => e.exerciseId);

    // Worth asking about the template, but only after the session is safe.
    // Started from one, the question is what to do about the drift; started
    // from nothing that matches, it is whether this line-up is worth keeping.
    let offer: TemplateOffer | undefined;
    if (sourceGroup) {
      if (!sameExerciseIds(sourceGroup.exerciseIds, exerciseIds)) {
        offer = {
          exerciseIds,
          defaultName: trimmedName,
          sourceGroupId: sourceGroup.id,
          sourceGroupName: sourceGroup.name,
        };
      }
    } else if (!exerciseIdsMatchExistingGroup(exerciseIds)) {
      offer = { exerciseIds, defaultName: trimmedName };
    }

    commitWorkout(workout, offer);
  }

  const showActiveSession = isEdit || isFocusedRoute;
  const showEmptyState = !isEdit && !isFocusedRoute;
  const todayIso = todayString();
  const hasTodaysWorkout = !isEdit && !isFocusedRoute && appData.workouts.some((w) => w.date === todayIso);
  const ratingMatch = notes.match(/^Rating: (\d+)/);
  const currentRating = ratingMatch ? parseInt(ratingMatch[1], 10) : 0;

  const totalExercises = entries.length;
  const totalSets = entries.reduce((acc, e) => acc + e.sets.length, 0);
  const totalReps = entries.reduce(
    (acc, e) =>
      acc +
      e.sets.reduce((s, set, i) => (isUnconfirmed(unconfirmed, e.id, i) ? s : s + (set.reps || 0)), 0),
    0,
  );
  const doneCount = entries.filter((e) => e.done).length;
  const pendingCount = totalExercises - doneCount;
  // An empty session keeps its existing "add an exercise" validation instead.
  const saveGated = totalExercises > 0 && pendingCount > 0;

  return (
    <div
      className={`flex flex-col gap-5 ${sessionLive && rest.phase !== 'idle' ? 'pb-32' : 'pb-8'}`}
    >

      {/* Time, sets, volume and a chip per exercise, pinned while the cards
          scroll underneath. Replaces the old session-time row. */}
      {showActiveSession && !isEdit && entries.length > 0 && (
        <SessionStrip
          ref={stripRef}
          entries={entries}
          unconfirmed={unconfirmed}
          startedAt={startedAt}
          tappedId={tappedChipId}
          bodyParts={bodyPartsOfTemplate(
            entries.map((e) => e.exerciseId),
            appData.exercises,
          )}
          onSelect={handleChipSelect}
        />
      )}

      {showActiveSession && entries.length > 0 && (
        <div
          className="flex flex-col gap-4"
          style={{ background: 'var(--color-bg)' }}
        >
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              data-entry-id={entry.id}
              ref={registerItem(entry.id)}
              onPointerDown={entries.length > 1 ? handleLongPressDown(entry.id) : undefined}
              onClickCapture={entries.length > 1 ? handleLongPressClickCapture : undefined}
              // iOS answers a long press with the selection callout otherwise,
              // which steals the gesture before the hold completes.
              onContextMenu={(e) => e.preventDefault()}
              style={{ WebkitTouchCallout: 'none' }}
            >
              <EntryCard
                index={index}
                exerciseId={entry.exerciseId}
                sets={entry.sets}
                previousSets={getLastWorkoutSets(entry.exerciseId) ?? undefined}
                onSetsChange={(sets, change) => handleSetsChange(index, sets, change)}
                onRemove={() => handleRemoveEntry(index)}
                collapsed={collapsedIds.has(entry.id)}
                onToggleCollapsed={() => toggleCollapsed(entry.id)}
                done={!!entry.done}
                onToggleDone={() => handleToggleDone(index)}
                isDragging={draggingId === entry.id}
                onReorderKeyDown={entries.length > 1 ? handleKeyDown(entry.id) : undefined}
              />
            </div>
          ))}
        </div>
      )}

      {showActiveSession && (
        <button
          type="button"
          onClick={() => setShowExerciseSelect(true)}
          className="press h-20 flex items-center justify-center gap-3"
          style={{
            color: 'var(--color-volt)',
            background: 'var(--color-volt-tint)',
            border: '1.5px dashed var(--color-volt)',
            borderRadius: 'var(--radius)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" className="w-5 h-5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <div className="text-left">
            <div
              className="font-display leading-none"
              style={{
                fontSize: '1.0625rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                fontVariationSettings: '"wdth" 95',
              }}
            >
              Add Exercise
            </div>
          </div>
        </button>
      )}

      {!loading && showEmptyState && groups.length === 0 && !hasTodaysWorkout && createPortal(
        <div
          className="fixed left-0 right-0 z-40 px-6 flex flex-col items-center justify-center pointer-events-none"
          style={{
            top: `calc(var(--safe-top) + 300px)`,
            bottom: `calc(60px + var(--safe-bottom))`,
          }}
        >
          <img
            src={heroIllustration}
            alt=""
            aria-hidden
            className="pointer-events-none mb-4 w-full max-w-[190px]"
            style={{ height: 'auto' }}
          />
          <p
            className="caps-tight text-[11px] text-center"
            style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
          >
            LET'S GET YOU STARTED WITH YOUR WORKOUT
          </p>
        </div>,
        document.body,
      )}

      {showExerciseSelect && (
        <ExerciseSelect
          manageHistory={!pickerOpensEmptySession}
          onSelect={handleSelectExercise}
          onClose={() => {
            setShowExerciseSelect(false);
            // Nothing was picked and there's nothing behind the sheet, so the
            // session was never really started — go back where it began.
            if (pickerOpensEmptySession) navigate('/', { replace: true });
          }}
        />
      )}

      {/* HERO — session header + RPE rating */}
      {showActiveSession && (
      <section className="relative card">
        <div className="relative p-4">
          <div className="flex items-center justify-between">
            <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
              SESSION {isEdit ? 'EDIT' : 'NEW'}
            </div>
          </div>
          <div className="mt-2">
            <DatePicker value={date} onChange={setDate} />
          </div>
          <div
            className="grid grid-cols-3 mt-4"
            style={{ borderTop: '1px solid var(--color-line)' }}
          >
            <HeroStat label="EXERCISES" value={totalExercises} />
            <HeroStat label="SETS" value={totalSets} divider />
            <HeroStat label="REPS" value={totalReps} divider />
          </div>
          <div
            className="mt-4 pt-4"
            style={{ borderTop: '1px solid var(--color-line)' }}
          >
            <div className="caps-tight text-[9px] mb-2" style={{ color: 'var(--color-text-muted)' }}>
              RPE SESSION RATING
            </div>
            <div className="grid grid-cols-10 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                const isSelected = currentRating === n;
const color = ratingColor(n)!;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      const existing = notes.replace(/^Rating: \d+\n?/, '').trim();
                      setNotes(`Rating: ${n}${existing ? '\n' + existing : ''}`);
                    }}
                    className="h-10 press font-mono text-[12px]"
                    style={{
                      background: isSelected ? color : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--color-text-muted)',
                      border: `1px solid ${isSelected ? color : 'var(--color-line-2)'}`,
                      borderRadius: 'var(--radius)',
                      fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <div
              className="flex justify-between mt-1.5 caps-tight text-[9px]"
              style={{ color: 'var(--color-text-faint)' }}
            >
              <span>EASY</span>
              <span>MODERATE</span>
              <span>MAX</span>
            </div>
          </div>
        </div>
      </section>
      )}

      {validationError && (
        <p className="caps-tight text-[10px] text-center" style={{ color: 'var(--color-rust)' }}>
          ⚠ {validationError}
        </p>
      )}

      {showActiveSession && (
      <div className="flex flex-col gap-2">
        {totalExercises > 0 && (
          <div
            id="save-gate-hint"
            className="flex items-center justify-between caps-tight text-[9px]"
            style={{ color: saveGated ? 'var(--color-text-muted)' : 'var(--color-done-deep)' }}
          >
            <span>
              {saveGated
                ? `${pendingCount} EXERCISE${pendingCount === 1 ? '' : 'S'} LEFT TO MARK DONE`
                : 'ALL EXERCISES DONE'}
            </span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {String(doneCount).padStart(2, '0')}/{String(totalExercises).padStart(2, '0')}
            </span>
          </div>
        )}
        <div
          aria-hidden
          style={{ height: '2px', background: 'var(--color-line)', borderRadius: 'var(--radius)' }}
        >
          <div
            style={{
              height: '100%',
              width: totalExercises > 0 ? `${(doneCount / totalExercises) * 100}%` : '0%',
              background: 'var(--color-done)',
              transition: 'width 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saveGated}
          aria-describedby={saveGated ? 'save-gate-hint' : undefined}
          className={`w-full h-14 caps-tight text-[11px] ${saveGated ? '' : 'btn-volt press'}`}
          style={
            saveGated
              ? {
                  borderRadius: 'var(--radius)',
                  letterSpacing: '0.12em',
                  background: 'var(--color-elev-2)',
                  color: 'var(--color-text-faint)',
                  border: '1px solid var(--color-line-2)',
                  cursor: 'not-allowed',
                }
              : { borderRadius: 'var(--radius)', letterSpacing: '0.12em' }
          }
        >
          {isEdit ? 'Update Session →' : 'Save Session →'}
        </button>
      </div>
      )}

      {showActiveSession && !isEdit && (
        <button
          type="button"
          onClick={handleCancel}
          className="w-full h-12 press caps-tight text-[11px]"
          style={{
            borderRadius: 'var(--radius)',
            letterSpacing: '0.12em',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-line-2)',
          }}
        >
          CANCEL
        </button>
      )}

      {sessionLive && <RestTimer timer={rest} />}

      {showCancelConfirm && (
        <ConfirmModal
          eyebrow="DISCARD WORKOUT"
          title="Discard this workout?"
          message="Your current exercises and sets will be lost."
          confirmLabel="DISCARD →"
          cancelLabel="KEEP"
          destructive
          onConfirm={discardWorkout}
          onClose={() => setShowCancelConfirm(false)}
        />
      )}

    </div>
  );
}

function HeroStat({ label, value, divider }: { label: string; value: number; divider?: boolean }) {
  return (
    <div
      className="pt-3 px-1"
      style={divider ? { borderLeft: '1px solid var(--color-line)' } : undefined}
    >
      <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
        {label}
      </div>
      <div
        className="font-mono leading-none mt-1"
        style={{
          fontSize: '1.75rem',
          fontWeight: 500,
          color: value > 0 ? 'var(--color-volt)' : 'var(--color-text-faint)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {String(value).padStart(2, '0')}
      </div>
    </div>
  );
}
