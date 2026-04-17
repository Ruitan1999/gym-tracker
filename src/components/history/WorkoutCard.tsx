import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { kgToLb } from '../../utils/conversions';
import type { Workout } from '../../types';

interface WorkoutCardProps {
  workout: Workout;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function WorkoutCard({ workout }: WorkoutCardProps) {
  const navigate = useNavigate();
  const { appData } = useAppContext();
  const unit = appData.preferences.weightUnit;

  const exerciseCount = workout.entries.length;
  const totalSets = workout.entries.reduce(
    (sum, entry) => sum + entry.sets.length, 0
  );
  const totalVolumeKg = workout.entries.reduce(
    (sum, entry) =>
      sum + entry.sets.reduce((s, set) => s + set.reps * set.weightKg, 0),
    0
  );
  const displayVolume = unit === 'lb' ? kgToLb(totalVolumeKg) : totalVolumeKg;
  const volumeLabel =
    displayVolume < 10000
      ? `${Math.round(displayVolume)} ${unit}`
      : `${(displayVolume / 1000).toFixed(1)}k ${unit}`;

  const exerciseNames = workout.entries.map((entry) => {
    const exercise = appData.exercises.find((e) => e.id === entry.exerciseId);
    return exercise?.name ?? 'Unknown';
  });

  let summaryLine = '';
  if (exerciseNames.length === 0) {
    summaryLine = 'No exercises';
  } else if (exerciseNames.length <= 2) {
    summaryLine = exerciseNames.join(', ');
  } else {
    summaryLine = `${exerciseNames[0]}, ${exerciseNames[1]} +${exerciseNames.length - 2} more`;
  }

  // Parse rating
  const ratingMatch = workout.notes?.match(/^Rating: (\d+)/);
  const rating = ratingMatch ? parseInt(ratingMatch[1]) : null;

  return (
    <button
      type="button"
      onClick={() => navigate(`/history/${workout.id}`)}
      className="bg-white rounded-xl p-4 shadow-sm w-full text-left active:bg-gray-50 transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-base font-semibold text-gray-900">
          {formatDate(workout.date)}
        </span>
        <div className="flex items-center gap-2">
          {rating && (
            <span className={`w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center ${
              rating <= 3 ? 'bg-red-500' : rating <= 6 ? 'bg-amber-500' : 'bg-green-500'
            }`}>
              {rating}
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 truncate">{summaryLine}</p>
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
        <span>{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</span>
        <span>&middot;</span>
        <span>{totalSets} set{totalSets !== 1 ? 's' : ''}</span>
        <span>&middot;</span>
        <span>{volumeLabel} vol</span>
      </div>
    </button>
  );
}
