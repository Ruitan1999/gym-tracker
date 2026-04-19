import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ExerciseSelect from '../shared/ExerciseSelect';
import DatePicker from '../shared/DatePicker';
import EntryCard from './EntryCard';
import SaveTemplatePrompt from './SaveTemplatePrompt';
import type { Workout, WorkoutEntry, WorkoutGroup, WorkoutSet } from '../../types';

interface WorkoutFormProps {
  existingWorkout?: Workout;
}

function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const DRAFT_KEY = 'liftgauge.workoutDraft.v1';

interface Draft {
  date: string;
  entries: WorkoutEntry[];
  notes: string;
  collapsedIds: string[];
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Draft;
  } catch {
    return null;
  }
}

export default function WorkoutForm({ existingWorkout }: WorkoutFormProps) {
  const { appData, addWorkout, updateWorkout, addGroup, showSessionSaved } = useAppContext();
  const navigate = useNavigate();
  const isEdit = !!existingWorkout;

  const draft = !isEdit ? loadDraft() : null;

  const [date, setDate] = useState(existingWorkout?.date ?? draft?.date ?? todayString());
  const [entries, setEntries] = useState<WorkoutEntry[]>(existingWorkout?.entries ?? draft?.entries ?? []);
  const [notes, setNotes] = useState(existingWorkout?.notes ?? draft?.notes ?? '');
  const [showExerciseSelect, setShowExerciseSelect] = useState(false);
  const [pendingWorkout, setPendingWorkout] = useState<Workout | null>(null);
  const [validationError, setValidationError] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    new Set(draft?.collapsedIds ?? []),
  );
  const [scrollToEntryId, setScrollToEntryId] = useState<string | null>(null);

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
      const OFFSET = 80;
      if (scroller && scroller !== document.body) {
        const elTop = el.getBoundingClientRect().top;
        const scTop = scroller.getBoundingClientRect().top;
        scroller.scrollTo({ top: scroller.scrollTop + (elTop - scTop) - OFFSET, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - OFFSET, behavior: 'smooth' });
      }
    }
    setScrollToEntryId(null);
  }, [scrollToEntryId]);

  useEffect(() => {
    if (isEdit) return;
    if (entries.length === 0 && !notes && date === todayString()) {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }
    const payload: Draft = { date, entries, notes, collapsedIds: [...collapsedIds] };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  }, [isEdit, date, entries, notes, collapsedIds]);

  const groups = appData.groups ?? [];

  function getLastWorkoutSets(exerciseId: string): WorkoutSet[] | null {
    const sorted = [...appData.workouts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    for (const w of sorted) {
      if (existingWorkout && w.id === existingWorkout.id) continue;
      const entry = w.entries.find((e) => e.exerciseId === exerciseId);
      if (entry && entry.sets.length > 0) {
        return entry.sets.map((s, i) => ({
          setNumber: i + 1,
          reps: s.reps,
          weightKg: s.weightKg,
        }));
      }
    }
    return null;
  }

  function handleSelectExercise(exerciseId: string) {
    const lastSets = getLastWorkoutSets(exerciseId);
    const sets: WorkoutSet[] = lastSets
      ? lastSets.map((_, j) => ({ setNumber: j + 1, reps: 0, weightKg: 0 }))
      : [{ setNumber: 1, reps: 0, weightKg: 0 }];
    const newEntry: WorkoutEntry = {
      id: crypto.randomUUID(),
      exerciseId,
      sets,
    };
    setCollapsedIds(new Set(entries.map((e) => e.id)));
    setEntries((prev) => [...prev, newEntry]);
    setShowExerciseSelect(false);
    setScrollToEntryId(newEntry.id);
  }

  function toggleCollapsed(entryId: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  }

  function handleSetsChange(entryIndex: number, sets: WorkoutSet[]) {
    setEntries((prev) => prev.map((e, i) => (i === entryIndex ? { ...e, sets } : e)));
  }

  function handleRemoveEntry(entryIndex: number) {
    setEntries((prev) => prev.filter((_, i) => i !== entryIndex));
  }

  function handleStartFromGroup(group: WorkoutGroup) {
    const newEntries: WorkoutEntry[] = group.exerciseIds.map((exerciseId) => {
      const lastSets = getLastWorkoutSets(exerciseId);
      return {
        id: crypto.randomUUID(),
        exerciseId,
        sets: lastSets
          ? lastSets.map((_, j) => ({ setNumber: j + 1, reps: 0, weightKg: 0 }))
          : [{ setNumber: 1, reps: 0, weightKg: 0 }],
      };
    });
    setEntries(newEntries);
    if (newEntries.length > 1) {
      setCollapsedIds(new Set(newEntries.slice(1).map((e) => e.id)));
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const main = document.querySelector('main');
        if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
      });
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

  function commitPending(templateName?: string) {
    if (!pendingWorkout) return;
    addWorkout(pendingWorkout);
    const sets = pendingWorkout.entries.reduce((a, e) => a + e.sets.length, 0);
    const reps = pendingWorkout.entries.reduce(
      (a, e) => a + e.sets.reduce((s, set) => s + (set.reps || 0), 0),
      0,
    );
    const volumeKg = pendingWorkout.entries.reduce(
      (a, e) => a + e.sets.reduce((s, set) => s + set.reps * set.weightKg, 0),
      0,
    );
    showSessionSaved({
      exercises: pendingWorkout.entries.length,
      sets,
      reps,
      volumeKg,
      ...(templateName ? { templateName } : {}),
    });
    localStorage.removeItem(DRAFT_KEY);
    setPendingWorkout(null);
    navigate('/history');
  }

  function handleTemplatePromptSave(name: string) {
    if (!pendingWorkout) return;
    const group: WorkoutGroup = {
      id: crypto.randomUUID(),
      name,
      exerciseIds: pendingWorkout.entries.map((e) => e.exerciseId),
      createdAt: new Date().toISOString(),
    };
    addGroup(group);
    commitPending(name);
  }

  function handleTemplatePromptDismiss() {
    commitPending();
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
    if (isEdit && existingWorkout) {
      const updated: Workout = {
        ...existingWorkout,
        date,
        entries,
        ...(notes ? { notes } : {}),
      };
      if (!notes) delete (updated as Partial<Workout>).notes;
      updateWorkout(updated);
      localStorage.removeItem(DRAFT_KEY);
      navigate('/history');
      return;
    }
    const savedEntries = entries;
    const workout: Workout = {
      id: crypto.randomUUID(),
      date,
      entries: savedEntries,
      ...(notes ? { notes } : {}),
      createdAt: new Date().toISOString(),
    };

    const exerciseIds = savedEntries.map((e) => e.exerciseId);
    if (exerciseIdsMatchExistingGroup(exerciseIds)) {
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
      showSessionSaved({ exercises: workout.entries.length, sets, reps, volumeKg });
      localStorage.removeItem(DRAFT_KEY);
      navigate('/history');
      return;
    }
    setPendingWorkout(workout);
  }

  const showGroupsPicker = !isEdit && entries.length === 0 && groups.length > 0;
  const ratingMatch = notes.match(/^Rating: (\d+)/);
  const currentRating = ratingMatch ? parseInt(ratingMatch[1], 10) : 0;

  const totalExercises = entries.length;
  const totalSets = entries.reduce((acc, e) => acc + e.sets.length, 0);
  const totalReps = entries.reduce(
    (acc, e) => acc + e.sets.reduce((s, set) => s + (set.reps || 0), 0),
    0,
  );

  return (
    <div className="flex flex-col gap-5 pb-8">
      {!isEdit && entries.length === 0 && groups.length === 0 && (
        <p className="caps-tight text-[10px] -mt-3" style={{ color: 'var(--color-text-faint)' }}>
          TIP SAVE MULTIPLE EXERCISES AS A TEMPLATE TO REUSE
        </p>
      )}

      {/* Groups picker */}
      {showGroupsPicker && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="caps text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              SAVED TEMPLATES
            </h2>
            <Link
              to="/groups"
              className="caps text-[10px] press"
              style={{ color: 'var(--color-text)' }}
            >
              MANAGE →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {groups.map((g) => {
              const exCount = g.exerciseIds.length;
              const names = g.exerciseIds
                .map((id) => appData.exercises.find((e) => e.id === id)?.name)
                .filter(Boolean)
                .join(', ');
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleStartFromGroup(g)}
                  className="w-full text-left card press p-3"
                  style={{ borderLeft: '4px solid var(--color-volt)' }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="font-display min-w-0 truncate"
                      style={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        letterSpacing: '-0.02em',
                        fontVariationSettings: '"wdth" 95',
                        color: 'var(--color-text)',
                      }}
                    >
                      {g.name}
                    </div>
                    <div className="caps-tight text-[9px] shrink-0 ml-2" style={{ color: 'var(--color-text-faint)' }}>
                      {exCount} EXERCISE{exCount === 1 ? '' : 'S'}
                    </div>
                  </div>
                  {names && (
                    <div className="text-[12px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {names}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {entries.length > 0 && (
        <div
          className="flex flex-col gap-4 stagger"
          style={{ background: 'var(--color-bg)' }}
        >
          {entries.map((entry, index) => (
            <div key={entry.id} data-entry-id={entry.id}>
              <EntryCard
                index={index}
                exerciseId={entry.exerciseId}
                sets={entry.sets}
                previousSets={getLastWorkoutSets(entry.exerciseId) ?? undefined}
                onSetsChange={(sets) => handleSetsChange(index, sets)}
                onRemove={() => handleRemoveEntry(index)}
                collapsed={collapsedIds.has(entry.id)}
                onToggleCollapsed={() => toggleCollapsed(entry.id)}
              />
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowExerciseSelect(true)}
        className="press h-20 flex items-center justify-center gap-3"
        style={{
          color: 'var(--color-volt)',
          background: 'rgba(243, 91, 38, 0.08)',
          border: '1.5px dashed var(--color-volt)',
          borderRadius: '2px',
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
            {entries.length === 0 ? 'Add your first exercise' : 'Add Exercise'}
          </div>
        </div>
      </button>

      {showExerciseSelect && (
        <ExerciseSelect
          onSelect={handleSelectExercise}
          onClose={() => setShowExerciseSelect(false)}
        />
      )}

      {/* HERO — session header + RPE rating */}
      {(entries.length > 0 || isEdit) && (
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
                const color =
                  n <= 3 ? 'var(--color-steel)' : n <= 6 ? 'var(--color-ember)' : n <= 8 ? 'var(--color-volt)' : 'var(--color-rust)';
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

      {(entries.length > 0 || isEdit) && (
      <button
        type="button"
        onClick={handleSave}
        className="w-full h-14 btn-volt press caps-tight text-[11px]"
        style={{ borderRadius: '2px', letterSpacing: '0.12em' }}
      >
        {isEdit ? 'Update Session →' : 'Save Session →'}
      </button>
      )}

      {pendingWorkout && (
        <SaveTemplatePrompt
          exerciseNames={pendingWorkout.entries
            .map((e) => appData.exercises.find((x) => x.id === e.exerciseId)?.name ?? 'Exercise')}
          onSave={handleTemplatePromptSave}
          onDismiss={handleTemplatePromptDismiss}
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
