import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import PageShell from '../components/layout/PageShell';

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

  function handleDelete() {
    if (!workout) return;
    const confirmed = window.confirm('Delete this session? This cannot be undone.');
    if (confirmed) {
      deleteWorkout(workout.id);
      navigate('/history');
    }
  }

  if (!workout) {
    return (
      <PageShell title="Session" showBack>
        <p
          className="caps-tight text-[10px] text-center py-16"
          style={{ color: 'var(--color-text-faint)' }}
        >
          — NOT FOUND —
        </p>
      </PageShell>
    );
  }

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

  const ratingMatch = workout.notes?.match(/^Rating: (\d+)/);
  const rating = ratingMatch ? parseInt(ratingMatch[1]) : null;
  const notesText = workout.notes?.replace(/^Rating: \d+\n?/, '').trim() || null;

  const volumeStr =
    totalVolume < 10000 ? Math.round(totalVolume) : `${(totalVolume / 1000).toFixed(1)}K`;

  return (
    <PageShell
      title="Session"
      eyebrow="DETAIL READOUT"
      showBack
      rightAction={
        <button
          type="button"
          onClick={() => navigate(`/workout/${workout.id}`)}
          className="h-9 px-3 caps-tight text-[10px] press"
          style={{ color: 'var(--color-text)' }}
        >
          EDIT
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Date */}
        <div>
          <div
            className="caps-tight text-[9px] mb-1"
            style={{ color: 'var(--color-text-faint)' }}
          >
            LOGGED {workout.date}
          </div>
          <p
            className="font-display"
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--color-text)',
            }}
          >
            {formatDate(workout.date)}
          </p>
        </div>

        {/* Stats */}
        <section className="card">
          <div className="grid grid-cols-3">
            <Tile label="EXERCISES" value={totalExercises} />
            <Tile label="SETS" value={totalSets} divider />
            <Tile label="VOL KG" value={volumeStr} divider accent />
          </div>
        </section>

        {/* Top set highlight */}
        {topSet.weight > 0 && (
          <section
            className="p-4 flex items-center gap-4"
            style={{
              background: 'var(--color-elev)',
              border: '1px solid var(--color-volt)',
              borderRadius: '2px',
            }}
          >
            <div
              className="w-1.5 h-12"
              style={{ background: 'var(--color-volt)' }}
            />
            <div className="flex-1">
              <div
                className="caps-tight text-[9px]"
                style={{ color: 'var(--color-text)' }}
              >
                ▲ TOP SET
              </div>
              <div
                className="font-display mt-0.5"
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-text)',
                }}
              >
                {topSet.exercise}
              </div>
            </div>
            <div className="text-right">
              <span
                className="font-mono"
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}
              >
                {topSet.weight}
              </span>
              <span
                className="caps-tight text-[9px] ml-1"
                style={{ color: 'var(--color-text-faint)' }}
              >
                kg
              </span>
            </div>
          </section>
        )}

        {/* Rating */}
        {rating && (
          <section className="card p-4 flex items-center gap-4">
            <div
              className="w-12 h-12 flex items-center justify-center font-mono"
              style={{
                background: 'transparent',
                border: `1px solid ${
                  rating <= 3 ? 'var(--color-rust)' : rating <= 6 ? 'var(--color-ember)' : 'var(--color-text)'
                }`,
                color:
                  rating <= 3 ? 'var(--color-rust)' : rating <= 6 ? 'var(--color-ember)' : 'var(--color-text)',
                fontSize: '1.5rem',
                fontWeight: 500,
                borderRadius: '2px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {rating}
            </div>
            <div>
              <div
                className="caps-tight text-[9px]"
                style={{ color: 'var(--color-text-faint)' }}
              >
                RPE FEEL
              </div>
              <div
                className="text-[14px] mt-0.5"
                style={{ color: 'var(--color-text)', fontWeight: 500 }}
              >
                {rating <= 3 ? 'Tough session' : rating <= 6 ? 'Decent workout' : 'Felt great'}
              </div>
            </div>
          </section>
        )}

        {/* Exercise entries */}
        {workout.entries.map((entry, idx) => {
          const exercise = appData.exercises.find((e) => e.id === entry.exerciseId);
          const entryVolume = entry.sets.reduce((s, set) => s + set.reps * set.weightKg, 0);
          return (
            <section key={entry.id} className="card p-4">
              <div className="flex items-baseline justify-between mb-3">
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-mono text-[11px]"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)' }}>/</span>
                  <h3
                    className="font-display"
                    style={{
                      fontSize: '1.0625rem',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      color: 'var(--color-text)',
                    }}
                  >
                    {exercise?.name ?? 'Unknown Exercise'}
                  </h3>
                </div>
                <span
                  className="caps-tight text-[9px] font-mono"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  {Math.round(entryVolume)} kg
                </span>
              </div>
              <div>
                {entry.sets.map((set, i) => (
                  <div
                    key={set.setNumber}
                    className="flex items-center h-10"
                    style={{
                      borderTop: i === 0 ? '1px solid var(--color-line)' : undefined,
                      borderBottom: '1px solid var(--color-line)',
                    }}
                  >
                    <span
                      className="caps-tight text-[9px] w-10"
                      style={{ color: 'var(--color-text-faint)' }}
                    >
                      SET {String(set.setNumber).padStart(2, '0')}
                    </span>
                    <span
                      className="flex-1 font-mono flex items-baseline gap-4"
                      style={{
                        fontSize: '15px',
                        color: 'var(--color-text)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      <span className="flex items-baseline">
                        <span className="inline-block text-right" style={{ minWidth: '2.25rem' }}>
                          {set.reps}
                        </span>
                        <span
                          className="caps-tight text-[9px] ml-1"
                          style={{ color: 'var(--color-text-faint)' }}
                        >
                          REPS
                        </span>
                      </span>
                      <span className="flex items-baseline">
                        <span className="inline-block text-right" style={{ minWidth: '2.5rem' }}>
                          {set.weightKg}
                        </span>
                        <span
                          className="caps-tight text-[9px] ml-1"
                          style={{ color: 'var(--color-text-faint)' }}
                        >
                          kg
                        </span>
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Notes */}
        {notesText && (
          <section className="card p-4">
            <div
              className="caps-tight text-[9px] mb-2"
              style={{ color: 'var(--color-text-faint)' }}
            >
              NOTES MARGINALIA
            </div>
            <p
              className="text-[14px] whitespace-pre-wrap"
              style={{ color: 'var(--color-text)', letterSpacing: '-0.005em' }}
            >
              {notesText}
            </p>
          </section>
        )}

        {/* Delete */}
        <button
          type="button"
          onClick={handleDelete}
          className="h-12 press caps-tight text-[11px]"
          style={{
            background: 'transparent',
            color: 'var(--color-rust)',
            border: '1px solid var(--color-rust)',
            borderRadius: '2px',
          }}
        >
          ✕ DELETE SESSION
        </button>
      </div>
    </PageShell>
  );
}

function Tile({
  label,
  value,
  divider,
  accent,
}: {
  label: string;
  value: string | number;
  divider?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className="px-4 py-4"
      style={divider ? { borderLeft: '1px solid var(--color-line)' } : undefined}
    >
      <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
        {label}
      </div>
      <div
        className="font-mono leading-none mt-1.5"
        style={{
          fontSize: '1.5rem',
          fontWeight: 500,
          color: 'var(--color-text)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
    </div>
  );
}
