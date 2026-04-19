import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import type { Workout } from '../../types';

interface WorkoutCardProps {
  workout: Workout;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function WorkoutCard({ workout }: WorkoutCardProps) {
  const navigate = useNavigate();
  const { appData } = useAppContext();

  const d = parseDate(workout.date);
  const dayNum = d.getDate();
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  const exerciseCount = workout.entries.length;
  const totalSets = workout.entries.reduce((sum, e) => sum + e.sets.length, 0);
  const totalReps = workout.entries.reduce(
    (sum, e) => sum + e.sets.reduce((s, set) => s + (set.reps || 0), 0),
    0,
  );

  const exerciseNames = workout.entries.map((entry) => {
    const exercise = appData.exercises.find((e) => e.id === entry.exerciseId);
    return exercise?.name ?? 'Unknown';
  });

  const summary =
    exerciseNames.length === 0
      ? 'No exercises'
      : exerciseNames.length <= 2
      ? exerciseNames.join(' ')
      : `${exerciseNames[0]} ${exerciseNames[1]} +${exerciseNames.length - 2}`;

  const ratingMatch = workout.notes?.match(/^Rating: (\d+)/);
  const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : null;
  const ratingColor =
    rating == null
      ? null
      : rating <= 3
      ? 'var(--color-steel)'
      : rating <= 6
      ? 'var(--color-ember)'
      : rating <= 8
      ? 'var(--color-volt)'
      : 'var(--color-rust)';

  const time = formatTime(workout.createdAt);

  return (
    <button
      type="button"
      onClick={() => navigate(`/history/${workout.id}`)}
      className="w-full text-left card press flex"
    >
      {/* Date stub — like a torn calendar page */}
      <div
        className="shrink-0 w-20 flex flex-col items-center justify-center py-4"
        style={{
          borderRight: '1px solid var(--color-line)',
        }}
      >
        <div
          className="caps-tight text-[9px]"
          style={{ color: 'var(--color-text)' }}
        >
          {weekday}
        </div>
        <div
          className="font-display leading-none mt-0.5"
          style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            fontVariationSettings: '"wdth" 85',
            color: 'var(--color-text)',
          }}
        >
          {String(dayNum).padStart(2, '0')}
        </div>
        {time && (
          <div
            className="caps-tight text-[9px] mt-1"
            style={{ color: 'var(--color-text-faint)' }}
          >
            {time.replace(/\s/g, '')}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p
            className="font-display truncate leading-tight"
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              letterSpacing: '-0.015em',
              fontVariationSettings: '"wdth" 95',
              color: 'var(--color-text)',
            }}
          >
            {summary}
          </p>
          {rating && ratingColor && (
            <span
              className="font-mono text-[10px] shrink-0 px-1.5 py-0.5"
              style={{
                color: ratingColor,
                border: `1px solid ${ratingColor}`,
                fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              RPE {rating}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="EXERCISE" value={exerciseCount} />
          <MiniStat label="SETS" value={totalSets} />
          <MiniStat label="REPS" value={totalReps} />
        </div>
      </div>
    </button>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div className="caps-tight text-[8px]" style={{ color: 'var(--color-text-faint)' }}>
        {label}
      </div>
      <div
        className="font-mono leading-none mt-0.5"
        style={{
          fontSize: '0.9375rem',
          fontWeight: 500,
          color: 'var(--color-text)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}
