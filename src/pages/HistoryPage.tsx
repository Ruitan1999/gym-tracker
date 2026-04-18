import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import PageShell from '../components/layout/PageShell';
import EmptyState from '../components/shared/EmptyState';
import WorkoutCard from '../components/history/WorkoutCard';
import type { Workout } from '../types';

function getMonthLabel(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase();
}

export default function HistoryPage() {
  const { appData } = useAppContext();

  const { groupedWorkouts, totalSessions, totalVolume, currentStreak } = useMemo(() => {
    const sorted = [...appData.workouts].sort((a, b) => {
      const byCreated = (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
      return byCreated !== 0 ? byCreated : b.date.localeCompare(a.date);
    });

    const groups: { label: string; workouts: Workout[] }[] = [];
    let currentLabel = '';
    for (const workout of sorted) {
      const label = getMonthLabel(workout.date);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, workouts: [] });
      }
      groups[groups.length - 1].workouts.push(workout);
    }

    const volumeKg = sorted.reduce(
      (sum, w) =>
        sum +
        w.entries.reduce(
          (acc, e) =>
            acc + e.sets.reduce((s, set) => s + set.reps * set.weightKg, 0),
          0,
        ),
      0,
    );
    const totalVolumeStr =
      volumeKg >= 1_000_000
        ? `${(volumeKg / 1_000_000).toFixed(1)}M`
        : volumeKg >= 1000
        ? `${(volumeKg / 1000).toFixed(1)}K`
        : String(Math.round(volumeKg));

    // Current streak — consecutive days back from today with at least one workout
    const dateSet = new Set(sorted.map((w) => w.date));
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dateSet.has(iso)) streak++;
      else if (i > 0) break;
    }

    return {
      groupedWorkouts: groups,
      totalSessions: sorted.length,
      totalVolume: totalVolumeStr,
      currentStreak: streak,
    };
  }, [appData.workouts]);

  if (appData.workouts.length === 0) {
    return (
      <PageShell title="Log Book" eyebrow="02 ARCHIVE">
        <EmptyState
          message="No sessions logged yet"
          action={
            <Link
              to="/"
              className="inline-flex items-center justify-center h-12 px-6 caps-tight text-[11px] btn-volt press"
              style={{ borderRadius: '2px' }}
            >
              Start First Session →
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="Log Book" eyebrow="02 ARCHIVE">
      {/* Big stats */}
      <section className="card mb-6">
        <div className="grid grid-cols-3">
          <BigStat label="SESSIONS" value={totalSessions} />
          <BigStat label="TOTAL KG" value={totalVolume} divider />
          <BigStat label="STREAK" value={currentStreak} divider />
        </div>
      </section>

      <div className="flex flex-col gap-6">
        {groupedWorkouts.map((group) => (
          <section key={group.label}>
            <h2
              className="caps text-[10px] mb-3 flex items-center gap-3"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <span>{group.label}</span>
              <span
                className="flex-1 h-px"
                style={{ background: 'var(--color-line)' }}
              />
              <span style={{ color: 'var(--color-text-faint)' }}>
                {String(group.workouts.length).padStart(2, '0')} SESSION{group.workouts.length === 1 ? '' : 'S'}
              </span>
            </h2>
            <div className="flex flex-col gap-2">
              {group.workouts.map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}

function BigStat({
  label,
  value,
  divider,
}: {
  label: string;
  value: string | number;
  divider?: boolean;
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
          fontSize: '1.75rem',
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
