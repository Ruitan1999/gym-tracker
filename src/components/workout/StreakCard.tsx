import { useMemo } from 'react';
import IconLink from '../shared/IconLink';
import { CalendarDays, Flame } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { weeklyStreak } from '../../utils/streak';
import { useThisWeek } from '../../utils/useThisWeek';
import { todayString } from '../../utils/templateSession';

/**
 * The streak as one line, with this week against its plan and the running
 * total under it. Replaces the bigger momentum panel: the week's days now sit
 * on the Next Up card, so this only has to say how the run is going.
 */
export default function StreakCard() {
  const { appData } = useAppContext();
  // Part of the key so a phone left open past midnight rolls the week over.
  const today = todayString();
  const { trainedDays, plannedDays } = useThisWeek();
  const streak = useMemo(
    () => weeklyStreak(appData.workouts.map((w) => w.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appData.workouts, today],
  );
  const total = appData.workouts.length;

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
          className="font-mono text-[12px] mt-0.5"
          style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}
        >
          {plannedDays > 0 && trainedDays <= plannedDays ? `${trainedDays} / ${plannedDays}` : trainedDays}{' '}
          this week · {total} total
        </div>
      </div>
      <IconLink to="/history" label="Open Log Book" icon={<CalendarDays size={22} strokeWidth={1.75} />} />
    </section>
  );
}
