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
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function HistoryPage() {
  const { appData } = useAppContext();

  const groupedWorkouts = useMemo(() => {
    const sorted = [...appData.workouts].sort((a, b) =>
      b.date.localeCompare(a.date)
    );

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

    return groups;
  }, [appData.workouts]);

  if (appData.workouts.length === 0) {
    return (
      <PageShell title="History">
        <EmptyState
          message="No workouts yet"
          action={
            <Link
              to="/"
              className="inline-flex items-center justify-center bg-blue-600 text-white rounded-lg min-h-[44px] px-6 font-medium"
            >
              Log a Workout
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="History">
      <div className="flex flex-col gap-4">
        {groupedWorkouts.map((group) => (
          <div key={group.label}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {group.label}
            </h2>
            <div className="flex flex-col gap-2">
              {group.workouts.map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
