import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useMaybeAuth } from '../../context/AuthContext';

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STREAK_GOAL = 7;

function deriveName(user: { isAnonymous?: boolean; displayName?: string | null; email?: string | null } | null): string {
  if (!user || user.isAnonymous) return 'friend';
  if (user.displayName) return user.displayName.split(' ')[0];
  if (user.email) {
    const local = user.email.split('@')[0].split(/[._-]/)[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return 'friend';
}

export default function WeeklyInsights() {
  const { appData } = useAppContext();
  const auth = useMaybeAuth();
  const name = deriveName(auth?.user ?? null);

  const { streak, weekDays, totalSessions, weekCount } = useMemo(() => {
    const dateSet = new Set(appData.workouts.map((w) => w.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let s = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (dateSet.has(isoDate(d))) s++;
      else if (i > 0) break;
    }

    const dow = today.getDay();
    const mondayOffset = dow === 0 ? 6 : dow - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = isoDate(d);
      return {
        iso,
        letter: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
        trained: dateSet.has(iso),
        isToday: iso === isoDate(today),
        isFuture: d.getTime() > today.getTime(),
      };
    });

    return {
      streak: s,
      weekDays: days,
      totalSessions: appData.workouts.length,
      weekCount: days.filter((d) => d.trained).length,
    };
  }, [appData.workouts]);

  const streakPct = Math.min(streak / STREAK_GOAL, 1);

  return (
    <>
      <div className="mb-4">
        <div className="caps-tight text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
          WELCOME, {name.toUpperCase()}
        </div>
        <h1
          className="font-display leading-tight mt-0.5"
          style={{
            fontSize: '1.625rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            fontVariationSettings: '"wdth" 90',
            color: 'var(--color-text)',
          }}
        >
          Let's get training today.
        </h1>
      </div>
    <section
      className="card p-4 mb-4"
      style={{ background: '#ffffff', border: '1px solid var(--color-line)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
          MOMENTUM
        </div>
        <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
          {weekCount}/7 THIS WEEK
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <StreakRing pct={streakPct} value={streak} />
        <div className="flex-1 grid grid-cols-2 gap-3">
          <Metric label="STREAK" value={streak} unit={streak === 1 ? 'DAY' : 'DAYS'} accent />
          <Metric label="SESSIONS" value={totalSessions} unit={totalSessions === 1 ? 'TOTAL' : 'TOTAL'} />
        </div>
      </div>

      <div className="flex items-end gap-1.5">
        {weekDays.map((day, i) => (
          <DayBox key={i} {...day} />
        ))}
      </div>
    </section>
    </>
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
        {active && <FireIcon className="w-3 h-3 mt-0.5" color="var(--color-volt)" />}
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
}: {
  letter: string;
  trained: boolean;
  isToday: boolean;
  isFuture: boolean;
}) {
  const isPastMissed = !trained && !isFuture && !isToday;
  const bg = trained ? 'var(--color-volt)' : '#ffffff';
  const border = trained
    ? 'var(--color-volt)'
    : isToday
    ? 'var(--color-text)'
    : 'var(--color-line-2)';
  const textColor = trained
    ? '#ffffff'
    : isPastMissed
    ? 'var(--color-text-faint)'
    : 'var(--color-text)';

  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <div
        className="w-full flex items-center justify-center aspect-square md:aspect-[2/1]"
        style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: '2px',
          color: trained ? '#ffffff' : 'var(--color-text-faint)',
          opacity: isPastMissed ? 0.5 : 1,
        }}
      >
        {trained ? (
          <FireIcon className="w-4 h-4 md:w-6 md:h-6" />
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

function FireIcon({ className, color }: { className?: string; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2.25}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
    >
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}
