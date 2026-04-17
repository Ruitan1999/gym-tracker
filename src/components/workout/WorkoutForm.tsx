import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ExerciseSelect from '../shared/ExerciseSelect';
import DatePicker from '../shared/DatePicker';
import EntryCard from './EntryCard';
import type { Workout, WorkoutEntry, WorkoutSet } from '../../types';

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
  const { appData, addWorkout, updateWorkout } = useAppContext();
  const navigate = useNavigate();
  const isEdit = !!existingWorkout;

  const [date, setDate] = useState(existingWorkout?.date ?? todayString());
  const [entries, setEntries] = useState<WorkoutEntry[]>(
    existingWorkout?.entries ?? []
  );
  const [notes, setNotes] = useState(existingWorkout?.notes ?? '');
  const [showExerciseSelect, setShowExerciseSelect] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Find the last workout data for a given exercise to pre-fill sets
  function getLastWorkoutSets(exerciseId: string): WorkoutSet[] | null {
    const sorted = [...appData.workouts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
    // Pre-fill from last workout if available
    const lastSets = getLastWorkoutSets(exerciseId);
    const sets: WorkoutSet[] = lastSets ?? [{ setNumber: 1, reps: 0, weightKg: 0 }];

    const newEntry: WorkoutEntry = {
      id: crypto.randomUUID(),
      exerciseId,
      sets,
    };
    setEntries((prev) => [...prev, newEntry]);
    setShowExerciseSelect(false);
  }

  function handleSetsChange(entryIndex: number, sets: WorkoutSet[]) {
    setEntries((prev) =>
      prev.map((entry, i) => (i === entryIndex ? { ...entry, sets } : entry))
    );
  }

  function handleRemoveEntry(entryIndex: number) {
    setEntries((prev) => prev.filter((_, i) => i !== entryIndex));
  }

  function handleSave() {
    setValidationError('');

    if (entries.length === 0) {
      setValidationError('Add at least one exercise.');
      return;
    }

    const hasValidSet = entries.some((entry) =>
      entry.sets.some((set) => set.reps > 0)
    );
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

  function handleCancel() {
    navigate(-1);
  }

  // Repeat last workout: find the most recent workout and pre-fill all entries
  const lastWorkout = useMemo(() => {
    const sorted = [...appData.workouts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted[0] ?? null;
  }, [appData.workouts]);

  function handleRepeatLast() {
    if (!lastWorkout) return;
    const newEntries: WorkoutEntry[] = lastWorkout.entries.map((entry) => ({
      id: crypto.randomUUID(),
      exerciseId: entry.exerciseId,
      sets: entry.sets.map((s, i) => ({
        setNumber: i + 1,
        reps: s.reps,
        weightKg: s.weightKg,
      })),
    }));
    setEntries(newEntries);
  }

  const lastWorkoutLabel = useMemo(() => {
    if (!lastWorkout) return '';
    const names = lastWorkout.entries
      .map((e) => appData.exercises.find((ex) => ex.id === e.exerciseId)?.name)
      .filter(Boolean);
    if (names.length <= 2) return names.join(', ');
    return `${names[0]}, ${names[1]} +${names.length - 2} more`;
  }, [lastWorkout, appData.exercises]);

  return (
    <div className="flex flex-col gap-4">
      {/* Date input */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <label className="text-sm text-gray-500 font-medium block mb-1">Date</label>
        <DatePicker value={date} onChange={setDate} />
      </div>

      {/* Repeat last workout shortcut */}
      {!isEdit && entries.length === 0 && lastWorkout && (
        <button
          type="button"
          onClick={handleRepeatLast}
          className="bg-blue-50 rounded-xl p-4 text-left border border-blue-100"
        >
          <div className="text-sm font-semibold text-blue-700">Repeat last workout</div>
          <div className="text-xs text-blue-500 mt-0.5">{lastWorkoutLabel}</div>
        </button>
      )}

      {/* Entry cards */}
      {entries.map((entry, index) => (
        <EntryCard
          key={entry.id}
          exerciseId={entry.exerciseId}
          sets={entry.sets}
          onSetsChange={(sets) => handleSetsChange(index, sets)}
          onRemove={() => handleRemoveEntry(index)}
        />
      ))}

      {/* Add exercise button */}
      <button
        type="button"
        onClick={() => setShowExerciseSelect(true)}
        className="bg-white rounded-xl p-4 shadow-sm text-blue-600 font-medium text-center min-h-[44px] border-2 border-dashed border-blue-200"
      >
        + Add Exercise
      </button>

      {/* Exercise select bottom sheet */}
      {showExerciseSelect && (
        <ExerciseSelect
          onSelect={handleSelectExercise}
          onClose={() => setShowExerciseSelect(false)}
        />
      )}

      {/* Feeling & Notes */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <label className="text-sm text-gray-500 font-medium block mb-2">
          How did it feel?
        </label>
        <div className="flex justify-between gap-1 mb-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const rating = notes.match(/^Rating: (\d+)/);
            const currentRating = rating ? parseInt(rating[1]) : 0;
            const isSelected = currentRating === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => {
                  const existingNotes = notes.replace(/^Rating: \d+\n?/, '').trim();
                  setNotes(`Rating: ${n}${existingNotes ? '\n' + existingNotes : ''}`);
                }}
                className={`flex-1 h-10 rounded-lg text-sm font-semibold transition-colors ${
                  isSelected
                    ? n <= 3 ? 'bg-red-500 text-white'
                    : n <= 6 ? 'bg-amber-500 text-white'
                    : 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
        <textarea
          value={notes.replace(/^Rating: \d+\n?/, '')}
          onChange={(e) => {
            const rating = notes.match(/^Rating: \d+/);
            setNotes(rating ? `${rating[0]}\n${e.target.value}` : e.target.value);
          }}
          placeholder="Any notes? (optional)"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[16px] text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
        />
      </div>

      {/* Validation error */}
      {validationError && (
        <p className="text-red-600 text-sm text-center">{validationError}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 min-h-[44px] px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium bg-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
        >
          {isEdit ? 'Update Workout' : 'Save Workout'}
        </button>
      </div>
    </div>
  );
}
