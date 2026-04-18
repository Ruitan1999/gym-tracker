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
        <p className="text-gray-500 text-center py-16">Exercise not found</p>
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
    if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  return (
    <PageShell title={exercise.name} showBack>
      <div className="flex flex-col gap-4">
        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <div className="text-lg font-bold text-gray-900">{sessions}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Sessions</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <div className="text-lg font-bold text-gray-900">{fmt(bestMax)}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Best {unit}</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <div className="text-lg font-bold text-gray-900">{fmt(latestMax)}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Latest {unit}</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <div className="text-lg font-bold text-gray-900">{fmt(totalVolumeAll)}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Vol {unit}</div>
          </div>
        </div>

        {/* Max Weight chart */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Max Weight ({unit})
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={maxWeightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} width={50} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#6366F1"
                strokeWidth={2}
                dot={{ r: 4 }}
                name={`Weight (${unit})`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Total Volume chart */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Total Volume ({unit})
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={totalVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} width={50} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ r: 4 }}
                name={`Volume (${unit})`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent sessions */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Sessions</h3>
          <ul className="flex flex-col divide-y divide-gray-100">
            {recentSessions.slice(0, 10).map((s, idx) => {
              const topDisplay = unit === 'lb' ? kgToLb(s.topSet) : s.topSet;
              const volDisplay = unit === 'lb' ? kgToLb(s.volume) : s.volume;
              return (
                <li key={`${s.date}-${idx}`} className="py-2 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {formatShortDate(s.date)}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {s.sets.length} {s.sets.length === 1 ? 'set' : 'sets'} · vol {fmt(volDisplay)} {unit}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 tabular-nums">
                    {fmt(topDisplay)} {unit}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </PageShell>
  );
}
