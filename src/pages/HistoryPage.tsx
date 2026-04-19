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

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface MonthDay {
  iso: string;
  dayNum: number;
  trained: boolean;
  isToday: boolean;
  isFuture: boolean;
  isCurrentMonth: boolean;
}

export default function HistoryPage() {
  const { appData } = useAppContext();

  const { groupedWorkouts, totalSessions, heaviestLift, currentStreak, monthLabel, monthDays, monthTrainedCount } = useMemo(() => {
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

    let heaviestKg = 0;
    for (const w of sorted) {
      for (const e of w.entries) {
        for (const s of e.sets) {
          if (s.reps > 0 && s.weightKg > heaviestKg) heaviestKg = s.weightKg;
        }
      }
    }
    const heaviestLiftStr = heaviestKg > 0 ? String(heaviestKg) : '—';

    // Current streak — consecutive days back from today with at least one workout
    const dateSet = new Set(sorted.map((w) => w.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = isoLocal(today);
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (dateSet.has(isoLocal(d))) streak++;
      else if (i > 0) break;
    }

    // Month calendar — grid starting Monday of first week, through Sunday of last week
    const year = today.getFullYear();
    const month = today.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const firstDow = first.getDay();
    const mondayOffset = firstDow === 0 ? 6 : firstDow - 1;
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - mondayOffset);
    const lastDow = last.getDay();
    const sundayOffset = lastDow === 0 ? 0 : 7 - lastDow;
    const gridEnd = new Date(last);
    gridEnd.setDate(last.getDate() + sundayOffset);
    const totalCells = Math.round((gridEnd.getTime() - gridStart.getTime()) / 86_400_000) + 1;

    const days: MonthDay[] = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const iso = isoLocal(d);
      days.push({
        iso,
        dayNum: d.getDate(),
        trained: dateSet.has(iso),
        isToday: iso === todayIso,
        isFuture: d.getTime() > today.getTime(),
        isCurrentMonth: d.getMonth() === month,
      });
    }

    const label = first
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      .toUpperCase();
    const trainedInMonth = days.filter((d) => d.isCurrentMonth && d.trained).length;

    return {
      groupedWorkouts: groups,
      totalSessions: sorted.length,
      heaviestLift: heaviestLiftStr,
      currentStreak: streak,
      monthLabel: label,
      monthDays: days,
      monthTrainedCount: trainedInMonth,
    };
  }, [appData.workouts]);

  if (appData.workouts.length === 0) {
    return (
      <PageShell title="Log Book">
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
    <PageShell title="Log Book">
      {/* Big stats */}
      <section className="card mb-4">
        <div className="grid grid-cols-3">
          <BigStat label="STREAK" value={currentStreak} unit={currentStreak === 1 ? 'DAY' : 'DAYS'} accent={currentStreak > 0} />
          <BigStat label="HEAVIEST LIFT" value={heaviestLift} unit={heaviestLift === '—' ? undefined : 'KG'} divider />
          <BigStat label="SESSIONS" value={totalSessions} divider />
        </div>
      </section>

      {/* Month calendar */}
      <section className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
            {monthLabel}
          </div>
          <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
            {String(monthTrainedCount).padStart(2, '0')} DAY{monthTrainedCount === 1 ? '' : 'S'} TRAINED
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => (
            <div
              key={i}
              className="caps-tight text-[9px] text-center"
              style={{ color: 'var(--color-text-faint)' }}
            >
              {l}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((d) => (
            <CalendarCell key={d.iso} {...d} />
          ))}
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

function CalendarCell({
  dayNum,
  trained,
  isToday,
  isFuture,
  isCurrentMonth,
}: MonthDay) {
  if (!isCurrentMonth) {
    return <div style={{ aspectRatio: '1 / 1' }} />;
  }

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
    <div
      className="flex items-center justify-center"
      style={{
        aspectRatio: '1 / 1',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '2px',
        opacity: isPastMissed ? 0.55 : 1,
      }}
    >
      {trained ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth={2.25}
          strokeLinecap="square"
          strokeLinejoin="miter"
          className="w-4 h-4"
          aria-hidden
        >
          <path d="M6 15l6-6 6 6" />
        </svg>
      ) : (
        <span
          className="font-mono text-[11px] leading-none"
          style={{
            color: textColor,
            fontWeight: isToday ? 700 : 500,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {dayNum}
        </span>
      )}
    </div>
  );
}

function adaptiveValueSize(value: string | number): string {
  const len = String(value).length;
  if (len <= 3) return '1.75rem';
  if (len === 4) return '1.5rem';
  if (len === 5) return '1.25rem';
  return '1.05rem';
}

function BigStat({
  label,
  value,
  divider,
  accent = false,
  unit,
}: {
  label: string;
  value: string | number;
  divider?: boolean;
  accent?: boolean;
  unit?: string;
}) {
  return (
    <div
      className="px-4 py-4"
      style={divider ? { borderLeft: '1px solid var(--color-line)' } : undefined}
    >
      <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
        {label}
      </div>
      <div className="flex items-baseline gap-1 mt-1.5 min-w-0">
        <div
          className="font-mono leading-none min-w-0 truncate"
          style={{
            fontSize: adaptiveValueSize(value),
            fontWeight: 500,
            color: accent ? 'var(--color-volt)' : 'var(--color-text)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </div>
        {unit && (
          <span className="caps-tight text-[9px]" style={{ color: accent ? 'var(--color-volt)' : 'var(--color-text-faint)' }}>
            {unit}
          </span>
        )}
        {accent && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-volt)"
            strokeWidth={2.5}
            strokeLinecap="square"
            strokeLinejoin="miter"
            style={{ width: '0.85rem', height: '0.85rem', flexShrink: 0 }}
          >
            <path d="M6 15l6-6 6 6" />
          </svg>
        )}
      </div>
    </div>
  );
}
