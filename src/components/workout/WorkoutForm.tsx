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
  const [entries, setEntries] = useState<WorkoutEntry[]>(
    existingWorkout?.entries ?? []
  );
  const [notes, setNotes] = useState(existingWorkout?.notes ?? '');
  const [showExerciseSelect, setShowExerciseSelect] = useState(false);
  const [showSaveGroup, setShowSaveGroup] = useState(false);
  const [validationError, setValidationError] = useState('');

  const groups = appData.groups ?? [];

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

  const showGroupsPicker = !isEdit && entries.length === 0 && groups.length > 0;
  const canSaveAsGroup = !isEdit && entries.length > 0;

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Date input */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <label className="text-sm text-gray-500 font-medium block mb-1">Date</label>
        <DatePicker value={date} onChange={setDate} />
      </div>

      {/* Groups picker */}
      {showGroupsPicker && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-500">Start from a group</h2>
            <Link
              to="/groups"
              className="text-xs font-medium text-blue-600 active:text-blue-800"
            >
              Manage
            </Link>
          </div>
          <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1">
            {groups.map((g) => {
              const exCount = g.exerciseIds.length;
              const names = g.exerciseIds
                .slice(0, 2)
                .map((id) => appData.exercises.find((e) => e.id === id)?.name)
                .filter(Boolean)
                .join(', ');
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleStartFromGroup(g)}
                  className="shrink-0 min-w-[160px] max-w-[220px] text-left bg-blue-50 border border-blue-100 rounded-xl p-3 active:bg-blue-100"
                >
                  <div className="text-sm font-semibold text-blue-700 truncate">{g.name}</div>
                  <div className="text-xs text-blue-500 mt-0.5 truncate">
                    {exCount} exercise{exCount === 1 ? '' : 's'}{names ? ` · ${names}` : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!isEdit && entries.length === 0 && groups.length === 0 && (
        <p className="text-xs text-gray-400 text-center">
          Tip: after adding exercises, save them as a group (e.g. "Leg day") to reuse next time.
        </p>
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

      {/* Save as group */}
      {canSaveAsGroup && (
        <button
          type="button"
          onClick={() => setShowSaveGroup(true)}
          className="text-sm font-medium text-blue-600 min-h-[44px]"
        >
          Save as group…
        </button>
      )}

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

      {showSaveGroup && (
        <SaveGroupModal
          onSave={handleSaveAsGroup}
          onClose={() => setShowSaveGroup(false)}
        />
      )}
    </div>
  );
}
