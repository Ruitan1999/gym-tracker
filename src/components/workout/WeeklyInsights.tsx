import { useMemo } from 'react';
import { Dumbbell } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { weeklyStreak } from '../../utils/streak';
import { scheduledDaysThisWeek } from '../../utils/schedule';

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// A quarter of consistent weeks fills the ring.
const STREAK_GOAL_WEEKS = 12;

// A little heavier than the nav's 1.75, since these render at 12-16px rather
// than 22. Past 2 the icon's inner gaps close up and it goes solid.
const ICON_STROKE = 2;

export default function WeeklyInsights() {
  const { appData } = useAppContext();
  const { streak, weekDays, totalSessions, weekCount } = useMemo(() => {
    const dateSet = new Set(appData.workouts.map((w) => w.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const s = weeklyStreak(dateSet, today);

    const dow = today.getDay();
    const mondayOffset = dow === 0 ? 6 : dow - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);

    const planned = scheduledDaysThisWeek(appData.groups ?? []);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = isoDate(d);
      const isFuture = d.getTime() > today.getTime();
      return {
        iso,
        letter: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
        trained: dateSet.has(iso),
        isToday: iso === isoDate(today),
        isFuture,
        // Only ahead of today: a scheduled day already gone is either trained
        // or missed, and both of those the strip already says.
        scheduled: isFuture && planned.has(i),
      };
    });

    return {
      streak: s,
      weekDays: days,
      totalSessions: appData.workouts.length,
      weekCount: days.filter((d) => d.trained).length,
    };
  }, [appData.workouts, appData.groups]);

  const streakPct = Math.min(streak / STREAK_GOAL_WEEKS, 1);

  return (
    <section
      className="card p-4 mb-4"
      style={{ background: '#ffffff', border: '1px solid var(--color-line)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
          MOMENTUM
        </div>
        <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
          {weekCount} {weekCount === 1 ? 'SESSION' : 'SESSIONS'} THIS WEEK
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <StreakRing pct={streakPct} value={streak} />
        <div className="flex-1 grid grid-cols-2 gap-3">
          <Metric label="STREAK" value={streak} unit={streak === 1 ? 'WEEK' : 'WEEKS'} accent />
          <Metric label="SESSIONS" value={totalSessions} unit={totalSessions === 1 ? 'TOTAL' : 'TOTAL'} />
        </div>
      </div>

      <div className="flex items-end gap-1.5">
        {weekDays.map((day, i) => (
          <DayBox key={i} {...day} />
        ))}
      </div>
    </section>
  );
}

function StreakRing({ pct, value }: { pct: number; value: number }) {
  const size = 64;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const active = value > 0;
  const color = active ? 'var(--color-volt)' : 'var(--color-line-2)';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-line-2)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ color: active ? 'var(--color-text)' : 'var(--color-text-faint)' }}
      >
        <span
          className="font-mono leading-none"
          style={{ fontSize: '1.25rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
        >
          {value}
        </span>
        {active && (
          <Dumbbell className="w-3 h-3 mt-0.5" color="var(--color-volt)" strokeWidth={ICON_STROKE} />
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  accent = false,
}: {
  label: string;
  value: number | string;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
        {label}
      </div>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span
          className="font-mono leading-none"
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: accent ? 'var(--color-volt)' : 'var(--color-text)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
        <span className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

function DayBox({
  letter,
  trained,
  isToday,
  isFuture,
  scheduled = false,
}: {
  letter: string;
  trained: boolean;
  isToday: boolean;
  isFuture: boolean;
  scheduled?: boolean;
}) {
  const isPastMissed = !trained && !isFuture && !isToday;
  const bg = trained ? 'var(--color-volt)' : '#ffffff';
  const border = trained
    ? 'var(--color-volt)'
    : scheduled
    ? 'rgba(4, 120, 87, 0.5)'
    : isToday
    ? 'var(--color-text)'
    : 'var(--color-line-2)';
  const textColor = trained
    ? '#ffffff'
    : scheduled
    ? 'var(--color-volt)'
    : isPastMissed
    ? 'var(--color-text-faint)'
    : 'var(--color-text)';

  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <div
        className="w-full flex items-center justify-center aspect-square md:aspect-[2/1]"
        style={{
          background: bg,
          border: `1px ${scheduled && !trained ? 'dashed' : 'solid'} ${border}`,
          borderRadius: 'var(--radius)',
          color: trained ? '#ffffff' : 'var(--color-text-faint)',
          opacity: isPastMissed ? 0.5 : 1,
        }}
      >
        {trained ? (
          <Dumbbell className="w-4 h-4 md:w-6 md:h-6" strokeWidth={ICON_STROKE} />
        ) : (
          <span
            className="caps-tight text-[13px] md:text-[18px]"
            style={{ color: textColor, fontWeight: isToday ? 700 : 400 }}
          >
            {letter}
          </span>
        )}
      </div>
    </div>
  );
}
