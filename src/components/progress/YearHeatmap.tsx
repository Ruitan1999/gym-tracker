import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Workout } from '../../types';
import { buildYearHeatmap, shortDate } from '../../utils/yearHeatmap';
import type { HeatmapCell, HeatmapMode } from '../../utils/yearHeatmap';
import { formatSessionVolume } from '../../utils/sessionProgress';
import Segmented from './Segmented';

/** One day's pitch; the square inside is inset so the hit area stays larger. */
const PITCH = 14;
const INSET = 1.5;
const MONTH_ROW = 16;
const DAY_LABELS: [number, string][] = [
  [0, 'Mon'],
  [2, 'Wed'],
  [4, 'Fri'],
];

function levelFill(level: number): string {
  if (level === 0) return 'var(--color-elev-2)';
  const pct = [0, 28, 52, 76, 100][level];
  return `color-mix(in srgb, var(--color-volt) ${pct}%, var(--color-surface))`;
}

function minutesLabel(min: number): string {
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`;
}

export default function YearHeatmap({
  workouts,
  unit,
  today,
}: {
  workouts: Workout[];
  unit: 'kg' | 'lb';
  today?: Date;
}) {
  const [mode, setMode] = useState<HeatmapMode>('volume');
  const [picked, setPicked] = useState<string | null>(null);
  const now = useMemo(() => today ?? new Date(), [today]);
  const scroller = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  const map = useMemo(() => buildYearHeatmap(workouts, mode, now), [workouts, mode, now]);

  const flat = useMemo(() => map.weeks.flat(), [map]);
  const lastIndex = useMemo(() => {
    let i = flat.length - 1;
    while (i > 0 && flat[i].future) i -= 1;
    return i;
  }, [flat]);
  const [active, setActive] = useState<number | null>(null);
  const tabStop = Math.min(active ?? lastIndex, lastIndex);

  // Open on the most recent weeks.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  function valueText(v: number): string {
    return mode === 'time' ? minutesLabel(v) : formatSessionVolume(v, unit);
  }

  function cellText(c: HeatmapCell): string {
    // The grid spans a year plus a few days, so one date can occur twice: the
    // year is added to whichever is not this year.
    const year = Number(c.date.slice(0, 4));
    const when = year === now.getFullYear() ? shortDate(c.date) : `${shortDate(c.date)} ${year}`;
    if (c.value > 0) return `${when}, ${valueText(c.value)}`;
    if (c.sessions > 0) {
      return `${when}, ${mode === 'time' ? 'workout, no start time' : 'workout, no weight logged'}`;
    }
    return `${when}, no workout`;
  }

  function onKeyDown(e: KeyboardEvent) {
    const delta =
      e.key === 'ArrowRight' ? 7 : e.key === 'ArrowLeft' ? -7 : e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (delta === 0) return;
    e.preventDefault();
    const next = tabStop + delta;
    if (next < 0 || next > lastIndex) return;
    setActive(next);
    grid.current?.querySelector<HTMLButtonElement>(`[data-i="${next}"]`)?.focus();
  }

  const pickedCell = picked ? flat.find((c) => c.date === picked) : undefined;
  const summary =
    map.activeDays === 0
      ? mode === 'time'
        ? 'No timed sessions in the last 12 months'
        : 'No sessions in the last 12 months'
      : `${map.activeDays} active ${map.activeDays === 1 ? 'day' : 'days'} · ${valueText(map.total)} in total`;
  const readout = pickedCell ? cellText(pickedCell) : summary;
  const showUntimedNote = mode === 'time' && map.untimedSessions > 0;

  return (
    <section className="card p-4" aria-label="Activity over the last 12 months">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="caps-tight" style={{ color: 'var(--color-text-faint)' }}>
          LAST 12 MONTHS
        </h2>
      </div>
      <Segmented
        label="Heatmap measure"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'time', label: 'Time' },
          { value: 'volume', label: 'Volume' },
        ]}
      />

      <div className="flex mt-4">
        <div
          aria-hidden
          className="shrink-0 relative"
          style={{ width: 28, height: MONTH_ROW + PITCH * 7 }}
        >
          {DAY_LABELS.map(([row, name]) => (
            <span
              key={name}
              className="absolute left-0 caps-tight"
              style={{
                top: MONTH_ROW + row * PITCH,
                lineHeight: `${PITCH}px`,
                color: 'var(--color-text-faint)',
              }}
            >
              {name}
            </span>
          ))}
        </div>

        <div ref={scroller} className="overflow-x-auto flex-1 min-w-0" style={{ overscrollBehaviorX: 'contain' }}>
          <div
            className="relative"
            style={{ width: map.weeks.length * PITCH, height: MONTH_ROW + PITCH * 7 }}
          >
            <div aria-hidden>
              {map.months.map((m) => (
                <span
                  key={`${m.col}-${m.label}`}
                  className="absolute caps-tight"
                  style={{ left: m.col * PITCH, top: 0, color: 'var(--color-text-faint)' }}
                >
                  {m.label}
                </span>
              ))}
            </div>
            <div
              ref={grid}
              role="group"
              aria-label={`Activity by day, ${summary}. Arrow keys move between days.`}
              onKeyDown={onKeyDown}
              className="absolute left-0"
              style={{
                top: MONTH_ROW,
                display: 'grid',
                gridTemplateRows: `repeat(7, ${PITCH}px)`,
                gridAutoFlow: 'column',
                gridAutoColumns: `${PITCH}px`,
              }}
            >
              {flat.map((c, i) =>
                c.future ? (
                  <span key={c.date} aria-hidden />
                ) : (
                  <button
                    key={c.date}
                    type="button"
                    data-i={i}
                    tabIndex={i === tabStop ? 0 : -1}
                    aria-label={cellText(c)}
                    aria-pressed={picked === c.date}
                    onClick={() => {
                      setPicked(picked === c.date ? null : c.date);
                      setActive(i);
                    }}
                    style={{ width: PITCH, height: PITCH, padding: INSET }}
                  >
                    <span
                      className="block w-full h-full"
                      style={{
                        background: levelFill(c.level),
                        borderRadius: 2,
                        outline: c.isToday
                          ? '1.5px solid var(--color-text)'
                          : picked === c.date
                            ? '1.5px solid var(--color-volt)'
                            : 'none',
                        outlineOffset: c.isToday ? 0.5 : 0,
                      }}
                    />
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-3">
        <p
          className="font-mono text-[11px] min-w-0"
          style={{ color: pickedCell ? 'var(--color-text)' : 'var(--color-text-muted)' }}
          aria-live="polite"
        >
          {readout}
        </p>
        <div className="flex items-center gap-1 shrink-0" aria-hidden>
          <span className="caps-tight" style={{ color: 'var(--color-text-faint)' }}>
            LESS
          </span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              style={{ width: 10, height: 10, borderRadius: 2, background: levelFill(l) }}
            />
          ))}
          <span className="caps-tight" style={{ color: 'var(--color-text-faint)' }}>
            MORE
          </span>
        </div>
      </div>
      {showUntimedNote && (
        <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-text-faint)' }}>
          {map.untimedSessions === 1
            ? '1 older session has no start time and is left out.'
            : `${map.untimedSessions} older sessions have no start time and are left out.`}
        </p>
      )}
    </section>
  );
}
