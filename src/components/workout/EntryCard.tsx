import { useRef, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import SetRow from './SetRow';
import type { WorkoutSet } from '../../types';

interface EntryCardProps {
  exerciseId: string;
  sets: WorkoutSet[];
  onSetsChange: (sets: WorkoutSet[]) => void;
  onRemove: () => void;
}

let globalKeyCounter = 0;

export default function EntryCard({
  exerciseId,
  sets,
  onSetsChange,
  onRemove,
}: EntryCardProps) {
  const { appData } = useAppContext();
  const exercise = appData.exercises.find((e) => e.id === exerciseId);

  // Stable key tracking: parallel array of unique IDs for each set slot
  const stableKeysRef = useRef<string[]>([]);

  // Ensure we have a stable key for every current set
  while (stableKeysRef.current.length < sets.length) {
    stableKeysRef.current.push(`set-${++globalKeyCounter}`);
  }
  // Trim if sets were removed from the end externally
  if (stableKeysRef.current.length > sets.length) {
    stableKeysRef.current.length = sets.length;
  }

  const handleAddSet = useCallback(() => {
    // Copy reps & weight from the last set if one exists
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;
    const newSet: WorkoutSet = {
      setNumber: sets.length + 1,
      reps: lastSet?.reps ?? 0,
      weightKg: lastSet?.weightKg ?? 0,
    };
    stableKeysRef.current.push(`set-${++globalKeyCounter}`);
    onSetsChange([...sets, newSet]);
  }, [sets, onSetsChange]);

  const handleRemoveSet = useCallback((index: number) => {
    stableKeysRef.current.splice(index, 1);
    const updated = sets
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, setNumber: i + 1 }));
    onSetsChange(updated);
  }, [sets, onSetsChange]);

  const handleRepsChange = useCallback((index: number, value: number | '') => {
    const updated = sets.map((s, i) =>
      i === index ? { ...s, reps: value === '' ? 0 : value } : s
    );
    onSetsChange(updated);
  }, [sets, onSetsChange]);

  const handleWeightChange = useCallback((index: number, valueKg: number | '') => {
    const updated = sets.map((s, i) =>
      i === index ? { ...s, weightKg: valueKg === '' ? 0 : valueKg } : s
    );
    onSetsChange(updated);
  }, [sets, onSetsChange]);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">
          {exercise?.name ?? 'Unknown Exercise'}
        </h3>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 text-sm font-medium min-h-[44px] px-2"
        >
          Remove Exercise
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {sets.map((set, index) => (
          <SetRow
            key={stableKeysRef.current[index]}
            setNumber={set.setNumber}
            reps={set.reps}
            weightKg={set.weightKg}
            onRepsChange={(value) => handleRepsChange(index, value)}
            onWeightChange={(valueKg) => handleWeightChange(index, valueKg)}
            onRemove={() => handleRemoveSet(index)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddSet}
        className="mt-3 text-blue-600 text-sm font-medium min-h-[44px]"
      >
        + Add Set
      </button>
    </div>
  );
}
