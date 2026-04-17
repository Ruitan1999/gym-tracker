import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import PageShell from '../components/layout/PageShell';
import { kgToLb } from '../utils/conversions';

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appData, deleteWorkout } = useAppContext();

  const workout = appData.workouts.find((w) => w.id === id);
  const unit = appData.preferences.weightUnit;

  function displayWeight(kg: number): string {
    const value = unit === 'lb' ? kgToLb(kg) : kg;
    return `${value}`;
  }

  function handleDelete() {
    if (!workout) return;
    const confirmed = window.confirm(
      'Are you sure you want to delete this workout?'
    );
    if (confirmed) {
      deleteWorkout(workout.id);
      navigate('/history');
    }
  }

  if (!workout) {
    return (
      <PageShell title="Workout Detail" showBack>
        <p className="text-gray-500 text-center py-16">Workout not found</p>
      </PageShell>
    );
  }

  // Compute stats
  const totalExercises = workout.entries.length;
  const totalSets = workout.entries.reduce((sum, e) => sum + e.sets.length, 0);
  const totalVolume = workout.entries.reduce(
    (sum, e) => sum + e.sets.reduce((s, set) => s + set.reps * set.weightKg, 0),
    0
  );
  const topSet = workout.entries.reduce<{ weight: number; exercise: string }>(
    (best, entry) => {
      const exercise = appData.exercises.find((e) => e.id === entry.exerciseId);
      for (const set of entry.sets) {
        if (set.weightKg > best.weight) {
          best = { weight: set.weightKg, exercise: exercise?.name ?? 'Unknown' };
        }
      }
      return best;
    },
    { weight: 0, exercise: '' }
  );

  // Parse rating from notes
  const ratingMatch = workout.notes?.match(/^Rating: (\d+)/);
  const rating = ratingMatch ? parseInt(ratingMatch[1]) : null;
  const notesText = workout.notes?.replace(/^Rating: \d+\n?/, '').trim() || null;

  const displayVolume = unit === 'lb' ? kgToLb(totalVolume) : totalVolume;
  const displayTopWeight = unit === 'lb' ? kgToLb(topSet.weight) : topSet.weight;

  return (
    <PageShell
      title="Workout Detail"
      showBack
      rightAction={
        <button
          type="button"
          onClick={() => navigate(`/workout/${workout.id}`)}
          className="text-blue-600 font-medium min-h-[44px] px-2"
        >
          Edit
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Date header */}
        <p className="text-base font-semibold text-gray-900">
          {formatDate(workout.date)}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <div className="text-2xl font-bold text-gray-900">{totalExercises}</div>
            <div className="text-xs text-gray-500 mt-0.5">Exercises</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <div className="text-2xl font-bold text-gray-900">{totalSets}</div>
            <div className="text-xs text-gray-500 mt-0.5">Sets</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <div className="text-lg font-bold text-gray-900">
              {displayVolume < 10000
                ? Math.round(displayVolume)
                : `${(displayVolume / 1000).toFixed(1)}k`}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Volume ({unit})</div>
          </div>
        </div>

        {/* Top set highlight */}
        {topSet.weight > 0 && (
          <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 flex items-center gap-3">
            <span className="text-2xl">🏋️</span>
            <div>
              <div className="text-sm font-semibold text-indigo-700">Top Set</div>
              <div className="text-xs text-indigo-600">
                {topSet.exercise} — {displayTopWeight} {unit}
              </div>
            </div>
          </div>
        )}

        {/* Rating */}
        {rating && (
          <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
              rating <= 3 ? 'bg-red-500' : rating <= 6 ? 'bg-amber-500' : 'bg-green-500'
            }`}>
              {rating}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Feeling</div>
              <div className="text-xs text-gray-500">
                {rating <= 3 ? 'Tough session' : rating <= 6 ? 'Decent workout' : 'Felt great!'}
              </div>
            </div>
          </div>
        )}

        {/* Exercise entries */}
        {workout.entries.map((entry) => {
          const exercise = appData.exercises.find(
            (e) => e.id === entry.exerciseId
          );
          const entryVolume = entry.sets.reduce(
            (s, set) => s + set.reps * set.weightKg, 0
          );
          const displayEntryVolume = unit === 'lb' ? kgToLb(entryVolume) : entryVolume;
          return (
            <div key={entry.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">
                  {exercise?.name ?? 'Unknown Exercise'}
                </h3>
                <span className="text-xs text-gray-400">
                  {Math.round(displayEntryVolume)} {unit} vol
                </span>
              </div>
              <div className="space-y-2">
                {entry.sets.map((set) => (
                  <div key={set.setNumber} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-6">#{set.setNumber}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{set.reps} reps</span>
                      <span className="text-gray-300">&times;</span>
                      <span className="text-sm font-medium text-gray-900">{displayWeight(set.weightKg)} {unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Notes */}
        {notesText && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
            <p className="text-base text-gray-900 whitespace-pre-wrap">
              {notesText}
            </p>
          </div>
        )}

        {/* Delete button */}
        <button
          type="button"
          onClick={handleDelete}
          className="bg-red-50 text-red-600 rounded-lg min-h-[44px] px-4 py-2 font-medium"
        >
          Delete Workout
        </button>
      </div>
    </PageShell>
  );
}
