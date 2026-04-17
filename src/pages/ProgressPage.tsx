import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppContext } from '../context/AppContext';
import PageShell from '../components/layout/PageShell';
import EmptyState from '../components/shared/EmptyState';
import { getMaxWeightData, getTotalVolumeData } from '../utils/chartHelpers';
import { kgToLb } from '../utils/conversions';

export default function ProgressPage() {
  const { appData, updatePreferences } = useAppContext();
  const unit = appData.preferences.weightUnit;

  // Find exercises that have logged workout data
  const exercisesWithData = useMemo(() => {
    const ids = new Set<string>();
    for (const workout of appData.workouts) {
      for (const entry of workout.entries) {
        ids.add(entry.exerciseId);
      }
    }
    return appData.exercises.filter((e) => ids.has(e.id));
  }, [appData.workouts, appData.exercises]);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

  const maxWeightData = useMemo(() => {
    if (!selectedExerciseId) return [];
    const raw = getMaxWeightData(appData.workouts, selectedExerciseId);
    if (unit === 'lb') {
      return raw.map((p) => ({ ...p, value: kgToLb(p.value) }));
    }
    return raw;
  }, [appData.workouts, selectedExerciseId, unit]);

  const totalVolumeData = useMemo(() => {
    if (!selectedExerciseId) return [];
    const raw = getTotalVolumeData(appData.workouts, selectedExerciseId);
    if (unit === 'lb') {
      return raw.map((p) => ({ ...p, value: kgToLb(p.value) }));
    }
    return raw;
  }, [appData.workouts, selectedExerciseId, unit]);

  function handleUnitToggle(newUnit: 'kg' | 'lb') {
    updatePreferences({ weightUnit: newUnit });
  }

  const unitToggle = (
    <div className="flex rounded-lg overflow-hidden border border-gray-300">
      <button
        type="button"
        onClick={() => handleUnitToggle('kg')}
        className={`px-3 min-h-[36px] text-sm font-medium ${
          unit === 'kg'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700'
        }`}
      >
        kg
      </button>
      <button
        type="button"
        onClick={() => handleUnitToggle('lb')}
        className={`px-3 min-h-[36px] text-sm font-medium ${
          unit === 'lb'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700'
        }`}
      >
        lb
      </button>
    </div>
  );

  return (
    <PageShell title="Progress" rightAction={unitToggle}>
      <div className="flex flex-col gap-6">
        {/* Exercise picker */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label
            htmlFor="exercise-picker"
            className="text-sm text-gray-500 font-medium"
          >
            Exercise
          </label>
          <select
            id="exercise-picker"
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="mt-1 w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg text-[16px] text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Select an exercise</option>
            {exercisesWithData.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </div>

        {/* Charts or empty state */}
        {!selectedExerciseId || maxWeightData.length === 0 ? (
          <EmptyState
            message={
              !selectedExerciseId
                ? 'Select an exercise to view progress'
                : 'No data for this exercise'
            }
          />
        ) : (
          <>
            {/* Max Weight chart */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Max Weight ({unit})
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={maxWeightData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} width={50} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6366F1"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name={`Weight (${unit})`}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Total Volume chart */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Total Volume ({unit})
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={totalVolumeData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} width={50} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name={`Volume (${unit})`}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
