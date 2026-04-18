import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useAppContext } from '../context/AppContext';
import PageShell from '../components/layout/PageShell';
import EmptyState from '../components/shared/EmptyState';
import { getMaxWeightData, getTotalVolumeData } from '../utils/chartHelpers';
import { kgToLb } from '../utils/conversions';

function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ExerciseDetailPage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const { appData } = useAppContext();
  const unit = appData.preferences.weightUnit;
  const unitUpper = unit.toUpperCase();

  const exercise = appData.exercises.find((e) => e.id === exerciseId);

  const maxWeightData = useMemo(() => {
    if (!exerciseId) return [];
    const raw = getMaxWeightData(appData.workouts, exerciseId);
    return raw.map((p) => ({
      ...p,
      label: formatShortDate(p.date),
      value: unit === 'lb' ? kgToLb(p.value) : p.value,
    }));
  }, [appData.workouts, exerciseId, unit]);

  const totalVolumeData = useMemo(() => {
    if (!exerciseId) return [];
    const raw = getTotalVolumeData(appData.workouts, exerciseId);
    return raw.map((p) => ({
      ...p,
      label: formatShortDate(p.date),
      value: unit === 'lb' ? kgToLb(p.value) : p.value,
    }));
  }, [appData.workouts, exerciseId, unit]);

  const recentSessions = useMemo(() => {
    if (!exerciseId) return [];
    const out: {
      date: string;
      sets: { reps: number; weightKg: number }[];
      volume: number;
      topSet: number;
    }[] = [];
    for (const workout of appData.workouts) {
      for (const entry of workout.entries) {
        if (entry.exerciseId !== exerciseId) continue;
        const volume = entry.sets.reduce((s, set) => s + set.reps * set.weightKg, 0);
        const topSet = entry.sets.reduce((m, set) => (set.weightKg > m ? set.weightKg : m), 0);
        out.push({
          date: workout.date,
          sets: entry.sets.map((s) => ({ reps: s.reps, weightKg: s.weightKg })),
          volume,
          topSet,
        });
      }
    }
    out.sort((a, b) => b.date.localeCompare(a.date));
    return out;
  }, [appData.workouts, exerciseId]);

  if (!exercise) {
    return (
      <PageShell title="Exercise" showBack>
        <EmptyState message="Exercise not found" />
      </PageShell>
    );
  }

  if (maxWeightData.length === 0) {
    return (
      <PageShell title={exercise.name} showBack>
        <EmptyState message="No data logged for this exercise yet" />
      </PageShell>
    );
  }

  const bestMax = maxWeightData.reduce((m, p) => (p.value > m ? p.value : m), 0);
  const latestMax = maxWeightData[maxWeightData.length - 1].value;
  const totalVolumeAll = totalVolumeData.reduce((s, p) => s + p.value, 0);
  const sessions = maxWeightData.length;

  function fmt(n: number): string {
    if (n >= 10000) return `${(n / 1000).toFixed(1)}K`;
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  return (
    <PageShell title={exercise.name} showBack>
      <div className="flex flex-col gap-5">
        {/* Stats grid */}
        <section className="card">
          <div className="grid grid-cols-4">
            <BigStat label="SESSIONS" value={String(sessions).padStart(2, '0')} />
            <BigStat label={`BEST ${unitUpper}`} value={fmt(bestMax)} divider />
            <BigStat label={`LATEST ${unitUpper}`} value={fmt(latestMax)} divider accent />
            <BigStat label={`VOL ${unitUpper}`} value={fmt(totalVolumeAll)} divider />
          </div>
        </section>

        {/* Max Weight chart */}
        <section className="card p-4">
          <h3
            className="caps-tight text-[10px] mb-3"
            style={{ color: 'var(--color-text-muted)' }}
          >
            MAX WEIGHT · {unitUpper}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={maxWeightData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--color-line)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-line)' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-line-2)',
                  borderRadius: 2,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                }}
                labelStyle={{ color: 'var(--color-text-muted)' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-volt)"
                strokeWidth={1.75}
                dot={{ r: 3, fill: 'var(--color-volt)', stroke: 'var(--color-volt)' }}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
                name={`Weight (${unit})`}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* Total Volume chart */}
        <section className="card p-4">
          <h3
            className="caps-tight text-[10px] mb-3"
            style={{ color: 'var(--color-text-muted)' }}
          >
            TOTAL VOLUME · {unitUpper}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={totalVolumeData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--color-line)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-line)' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-line-2)',
                  borderRadius: 2,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                }}
                labelStyle={{ color: 'var(--color-text-muted)' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-steel)"
                strokeWidth={1.75}
                dot={{ r: 3, fill: 'var(--color-steel)', stroke: 'var(--color-steel)' }}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
                name={`Volume (${unit})`}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* Recent sessions */}
        <section>
          <h2
            className="caps text-[10px] mb-3 flex items-center gap-3"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span>RECENT SESSIONS</span>
            <span
              className="flex-1 h-px"
              style={{ background: 'var(--color-line)' }}
            />
            <span style={{ color: 'var(--color-text-faint)' }}>
              {String(Math.min(recentSessions.length, 10)).padStart(2, '0')}
            </span>
          </h2>
          <ul className="flex flex-col gap-2">
            {recentSessions.slice(0, 10).map((s, idx) => {
              const topDisplay = unit === 'lb' ? kgToLb(s.topSet) : s.topSet;
              const volDisplay = unit === 'lb' ? kgToLb(s.volume) : s.volume;
              return (
                <li
                  key={`${s.date}-${idx}`}
                  className="card px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-display leading-tight"
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        letterSpacing: '-0.015em',
                        fontVariationSettings: '"wdth" 95',
                        color: 'var(--color-text)',
                      }}
                    >
                      {formatShortDate(s.date)}
                    </div>
                    <div
                      className="caps-tight text-[9px] mt-1"
                      style={{ color: 'var(--color-text-faint)' }}
                    >
                      {String(s.sets.length).padStart(2, '0')} SET{s.sets.length === 1 ? '' : 'S'} · VOL {fmt(volDisplay)} {unitUpper}
                    </div>
                  </div>
                  <div
                    className="font-mono leading-none shrink-0"
                    style={{
                      fontSize: '1.0625rem',
                      fontWeight: 500,
                      color: 'var(--color-text)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {fmt(topDisplay)}
                    <span
                      className="caps-tight text-[9px] ml-1"
                      style={{ color: 'var(--color-text-faint)' }}
                    >
                      {unitUpper}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}

function BigStat({
  label,
  value,
  divider,
  accent,
}: {
  label: string;
  value: string | number;
  divider?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className="px-3 py-4"
      style={divider ? { borderLeft: '1px solid var(--color-line)' } : undefined}
    >
      <div
        className="caps-tight text-[9px] truncate"
        style={{ color: 'var(--color-text-faint)' }}
      >
        {label}
      </div>
      <div
        className="font-mono leading-none mt-1.5"
        style={{
          fontSize: '1.25rem',
          fontWeight: 500,
          color: accent ? 'var(--color-volt)' : 'var(--color-text)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
    </div>
  );
}
