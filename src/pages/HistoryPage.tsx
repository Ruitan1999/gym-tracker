import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import PageShell from '../components/layout/PageShell';
import EmptyState from '../components/shared/EmptyState';
import WorkoutCard from '../components/history/WorkoutCard';
import type { Workout } from '../types';
import { weeklyStreak } from '../utils/streak';

function getMonthLabel(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase();
}

// Matches the momentum panel's icon weight; these render even smaller.
const ICON_STROKE = 2;

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
  /** 0 is this month; every step back is a month earlier. */
  const [monthOffset, setMonthOffset] = useState(0);
  const calendarRef = useRef<HTMLElement>(null);

  const {
    groupedWorkouts,
    totalSessions,
    heaviestLift,
    currentStreak,
    monthLabel,
    monthDays,
    monthTrainedCount,
    earliestOffset,
  } = useMemo(() => {
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

    const dateSet = new Set(sorted.map((w) => w.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = isoLocal(today);
    const streak = weeklyStreak(dateSet, today);

    // Month calendar — grid starting Monday of first week, through Sunday of last week
    const year = today.getFullYear();
    const month = today.getMonth() + monthOffset;
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
        isCurrentMonth: d.getMonth() === first.getMonth() && d.getFullYear() === first.getFullYear(),
      });
    }

    const label = first
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      .toUpperCase();
    const trainedInMonth = days.filter((d) => d.isCurrentMonth && d.trained).length;

    // How far back there is anything to look at. Past the first session the
    // calendar is just empty grids, which is not browsing, it is falling off
    // the end.
    let oldest = 0;
    if (sorted.length > 0) {
      const last = sorted[sorted.length - 1].date;
      const [oy, om] = last.split('-').map(Number);
      oldest =
        (oy - today.getFullYear()) * 12 + (om - 1 - today.getMonth());
    }

    return {
      groupedWorkouts: groups,
      totalSessions: sorted.length,
      heaviestLift: heaviestLiftStr,
      currentStreak: streak,
      monthLabel: label,
      monthDays: days,
      monthTrainedCount: trainedInMonth,
      earliestOffset: Math.min(0, oldest),
    };
  }, [appData.workouts, monthOffset]);

  const step = useCallback(
    (by: number) => setMonthOffset((m) => Math.min(0, Math.max(earliestOffset, m + by))),
    [earliestOffset],
  );

  /**
   * Swiping the calendar steps a month.
   *
   * The axis is decided during the gesture and then locked: a sideways swipe
   * has its default prevented so the page does not scroll underneath it, and
   * anything vertical is left alone entirely. Reading only the end of the
   * gesture, as this did before, is too late — the scrolling has happened by
   * then, so a swipe both moved the month and dragged the page.
   *
   * Native listeners rather than React's, because preventDefault needs a
   * non-passive touchmove and React does not attach one.
   */
  useEffect(() => {
    const node = calendarRef.current;
    if (!node) return;

    let start: { x: number; y: number } | null = null;
    let axis: 'none' | 'x' | 'y' = 'none';

    const onStart = (e: globalThis.TouchEvent) => {
      if (e.touches.length !== 1) return;
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      axis = 'none';
    };

    const onMove = (e: globalThis.TouchEvent) => {
      if (!start) return;
      const dx = e.touches[0].clientX - start.x;
      const dy = e.touches[0].clientY - start.y;
      if (axis === 'none' && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
      }
      if (axis === 'x') e.preventDefault();
    };

    const onEnd = (e: globalThis.TouchEvent) => {
      const from = start;
      start = null;
      if (!from || axis !== 'x') return;
      const dx = e.changedTouches[0].clientX - from.x;
      if (Math.abs(dx) < 40) return;
      step(dx > 0 ? -1 : 1);
    };

    node.addEventListener('touchstart', onStart, { passive: true });
    node.addEventListener('touchmove', onMove, { passive: false });
    node.addEventListener('touchend', onEnd, { passive: true });
    node.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      node.removeEventListener('touchstart', onStart);
      node.removeEventListener('touchmove', onMove);
      node.removeEventListener('touchend', onEnd);
      node.removeEventListener('touchcancel', onEnd);
    };
  }, [step]);

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
          <BigStat label="STREAK" value={currentStreak} unit={currentStreak === 1 ? 'WEEK' : 'WEEKS'} accent={currentStreak > 0} />
          <BigStat label="TOP LIFT" value={heaviestLift} unit={heaviestLift === '—' ? undefined : 'KG'} divider />
          <BigStat label="SESSIONS" value={totalSessions} divider />
        </div>
      </section>

      {/* Month calendar */}
      <section
        ref={calendarRef}
        className="card p-4 mb-6"
        style={{ touchAction: 'pan-y' }}
      >
        <div className="flex items-center gap-1 mb-4">
          <MonthStep
            label="Previous month"
            icon={<ChevronLeft className="w-5 h-5" strokeWidth={2.25} />}
            disabled={monthOffset <= earliestOffset}
            onClick={() => step(-1)}
          />
          <button
            type="button"
            onClick={() => setMonthOffset(0)}
            disabled={monthOffset === 0}
            className="flex-1 min-w-0 text-center press disabled:opacity-100"
          >
            <span
              className="font-display block truncate"
              style={{
                fontSize: '1.0625rem',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                fontVariationSettings: '"wdth" 95',
                color: 'var(--color-text)',
              }}
            >
              {monthLabel}
            </span>
            {monthOffset !== 0 && (
              <span
                className="caps-tight text-[9px] block mt-0.5"
                style={{ color: 'var(--color-volt)', fontWeight: 700 }}
              >
                ← BACK TO TODAY
              </span>
            )}
          </button>
          <MonthStep
            label="Next month"
            icon={<ChevronRight className="w-5 h-5" strokeWidth={2.25} />}
            disabled={monthOffset >= 0}
            onClick={() => step(1)}
          />
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

        {/* Under the grid it counts, rather than above it competing with the
            month for the top of the card. */}
        <div
          className="caps-tight text-[9px] mt-3"
          style={{ color: 'var(--color-text-faint)' }}
        >
          {String(monthTrainedCount).padStart(2, '0')} DAY{monthTrainedCount === 1 ? '' : 'S'} TRAINED
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

function MonthStep({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-11 h-11 shrink-0 flex items-center justify-center press disabled:opacity-20"
      style={{ color: 'var(--color-text)' }}
    >
      {icon}
    </button>
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
        <Dumbbell className="w-4 h-4" color="#ffffff" strokeWidth={ICON_STROKE} aria-hidden />
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
          <Dumbbell
            color="var(--color-volt)"
            strokeWidth={ICON_STROKE}
            style={{ width: '0.85rem', height: '0.85rem', flexShrink: 0 }}
          />
        )}
      </div>
    </div>
  );
}
