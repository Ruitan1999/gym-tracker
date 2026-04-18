import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ExerciseSelect from '../shared/ExerciseSelect';
import DatePicker from '../shared/DatePicker';
import EntryCard from './EntryCard';
import SaveGroupModal from './SaveGroupModal';
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

export default function WorkoutForm({ existingWorkout }: WorkoutFormProps) {
  const { appData, addWorkout, updateWorkout, addGroup } = useAppContext();
  const navigate = useNavigate();
  const isEdit = !!existingWorkout;

  const [date, setDate] = useState(existingWorkout?.date ?? todayString());
  const [entries, setEntries] = useState<WorkoutEntry[]>(existingWorkout?.entries ?? []);
  const [notes, setNotes] = useState(existingWorkout?.notes ?? '');
  const [showExerciseSelect, setShowExerciseSelect] = useState(false);
  const [showSaveGroup, setShowSaveGroup] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

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
    const sets: WorkoutSet[] = lastSets ?? [{ setNumber: 1, reps: 0, weightKg: 0 }];
    const newEntry: WorkoutEntry = {
      id: crypto.randomUUID(),
      exerciseId,
      sets,
    };
    setCollapsedIds(new Set(entries.map((e) => e.id)));
    setEntries((prev) => [...prev, newEntry]);
    setShowExerciseSelect(false);
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
        sets: lastSets ?? [{ setNumber: 1, reps: 0, weightKg: 0 }],
      };
    });
    setEntries(newEntries);
    if (newEntries.length > 1) {
      setCollapsedIds(new Set(newEntries.slice(0, -1).map((e) => e.id)));
    }
  }

  function handleSaveAsGroup(name: string) {
    const group: WorkoutGroup = {
      id: crypto.randomUUID(),
      name,
      exerciseIds: entries.map((e) => e.exerciseId),
      createdAt: new Date().toISOString(),
    };
    addGroup(group);
    setShowSaveGroup(false);
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
    } else {
      const workout: Workout = {
        id: crypto.randomUUID(),
        date,
        entries,
        ...(notes ? { notes } : {}),
        createdAt: new Date().toISOString(),
      };
      addWorkout(workout);
    }
    navigate('/history');
  }

  const showGroupsPicker = !isEdit && entries.length === 0 && groups.length > 0;
  const canSaveAsGroup = !isEdit && entries.length > 0;
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
                .join(' ');
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleStartFromGroup(g)}
                  className="w-full text-left card press p-3"
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
            <EntryCard
              key={entry.id}
              index={index}
              exerciseId={entry.exerciseId}
              sets={entry.sets}
              onSetsChange={(sets) => handleSetsChange(index, sets)}
              onRemove={() => handleRemoveEntry(index)}
              collapsed={collapsedIds.has(entry.id)}
              onToggleCollapsed={() => toggleCollapsed(entry.id)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowExerciseSelect(true)}
        className="card-ghost press h-20 flex items-center justify-center gap-3"
        style={{ color: 'var(--color-text)', background: '#ffffff' }}
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

      {canSaveAsGroup && (
        <button
          type="button"
          onClick={() => setShowSaveGroup(true)}
          className="caps text-[10px] press self-start"
          style={{ color: 'var(--color-text)', padding: '0.75rem 0' }}
        >
          ＋ SAVE EXERCISES AS TEMPLATE
        </button>
      )}

      {showExerciseSelect && (
        <ExerciseSelect
          onSelect={handleSelectExercise}
          onClose={() => setShowExerciseSelect(false)}
        />
      )}

      {/* HERO — session header + RPE rating */}
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

      {validationError && (
        <p className="caps-tight text-[10px] text-center" style={{ color: 'var(--color-rust)' }}>
          ⚠ {validationError}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        className="w-full h-14 btn-volt press caps-tight text-[11px]"
        style={{ borderRadius: '2px', letterSpacing: '0.12em' }}
      >
        {isEdit ? 'Update Session →' : 'Save Session →'}
      </button>

      {showSaveGroup && (
        <SaveGroupModal onSave={handleSaveAsGroup} onClose={() => setShowSaveGroup(false)} />
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
          color: value > 0 ? 'var(--color-text)' : 'var(--color-text-faint)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {String(value).padStart(2, '0')}
      </div>
    </div>
  );
}
