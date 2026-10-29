import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Flame } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { weeklyStreak } from '../../utils/streak';
import { thisWeek } from '../../utils/thisWeek';
import { trainingModeOf } from '../../utils/rotation';

/**
 * The streak as one line, with this week against its plan and the running
 * total under it. Replaces the bigger momentum panel: the week's days now sit
 * on the Next Up card, so this only has to say how the run is going.
 */
export default function StreakCard() {
  const { appData } = useAppContext();
  const { streak, trainedDays, plannedDays, total } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const week = thisWeek(appData.workouts, appData.groups ?? [], trainingModeOf(appData.preferences));
    return {
      streak: weeklyStreak(new Set(appData.workouts.map((w) => w.date)), today),
      trainedDays: week.trainedDays,
      plannedDays: week.plannedDays,
      total: appData.workouts.length,
    };
  }, [appData.workouts, appData.groups, appData.preferences]);

  const active = streak > 0;

  return (
    <section
      className="card mb-4 flex items-center gap-3"
      style={{ padding: '14px 12px 14px 16px' }}
      aria-label="Streak"
    >
      <Flame
        aria-hidden
        size={22}
        strokeWidth={2}
        style={{ color: active ? 'var(--color-ember)' : 'var(--color-text-faint)', flexShrink: 0 }}
      />
      <div className="flex-1 min-w-0">
        <div
          className="font-display leading-tight"
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            fontVariationSettings: '"wdth" 95',
            color: 'var(--color-text)',
          }}
        >
          {active ? `${streak} week streak` : 'Start a streak this week'}
        </div>
        <div
          className="font-mono text-[12px] mt-0.5 truncate"
          style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}
        >
          {plannedDays > 0 ? `${trainedDays} / ${plannedDays}` : trainedDays} this week · {total}{' '}
          {total === 1 ? 'workout' : 'workouts'} total
        </div>
      </div>
      <Link
        to="/history"
        aria-label="Open Log Book"
        className="shrink-0 w-11 h-11 flex items-center justify-center press"
        style={{ color: 'var(--color-text)' }}
      >
        <CalendarDays size={22} strokeWidth={1.75} />
      </Link>
    </section>
  );
}
