import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import WorkoutCard from '../history/WorkoutCard';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TodayWork() {
  const { appData } = useAppContext();

  const todaysWorkouts = useMemo(() => {
    const today = todayIso();
    return appData.workouts
      .filter((w) => w.date === today)
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
  }, [appData.workouts]);

  if (todaysWorkouts.length === 0) return null;

  return (
    <section className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2
          className="font-display leading-none"
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            fontVariationSettings: '"wdth" 90',
            color: 'var(--color-text)',
          }}
        >
          Today's Work
        </h2>
        <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
          {String(todaysWorkouts.length).padStart(2, '0')}{' '}
          {todaysWorkouts.length === 1 ? 'SESSION' : 'SESSIONS'}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {todaysWorkouts.map((w) => (
          <WorkoutCard key={w.id} workout={w} />
        ))}
      </div>
    </section>
  );
}
