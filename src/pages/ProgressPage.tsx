import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../context/AppContext';
import PageShell from '../components/layout/PageShell';
import EmptyState from '../components/shared/EmptyState';
import { getMaxWeightData } from '../utils/chartHelpers';
import { kgToLb } from '../utils/conversions';
import type { Exercise } from '../types';

interface ExerciseSummary {
  exercise: Exercise;
  sessions: number;
  latestMax: number;
  bestMax: number;
  trend: number; // latest - previous
  lastDate: string;
  spark: { value: number }[];
}

type ViewMode = 'all' | 'groups';

export default function ProgressPage() {
  const { appData, updatePreferences } = useAppContext();
  const navigate = useNavigate();
  const unit = appData.preferences.weightUnit;
  const groups = appData.groups ?? [];

  const [viewMode, setViewMode] = useState<ViewMode>('all');

  const summaries = useMemo<ExerciseSummary[]>(() => {
    const result: ExerciseSummary[] = [];
    for (const exercise of appData.exercises) {
      const points = getMaxWeightData(appData.workouts, exercise.id);
      if (points.length === 0) continue;
      const latestMax = points[points.length - 1].value;
      const prevMax = points.length > 1 ? points[points.length - 2].value : latestMax;
      const bestMax = points.reduce((m, p) => (p.value > m ? p.value : m), 0);
      result.push({
        exercise,
        sessions: points.length,
        latestMax,
        bestMax,
        trend: latestMax - prevMax,
        lastDate: points[points.length - 1].date,
        spark: points.map((p) => ({ value: p.value })),
      });
    }
    result.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
    return result;
  }, [appData.exercises, appData.workouts]);

  const summaryById = useMemo(() => {
    const map = new Map<string, ExerciseSummary>();
    for (const s of summaries) map.set(s.exercise.id, s);
    return map;
  }, [summaries]);

  const groupedSections = useMemo(() => {
    const sections: { id: string; name: string; items: ExerciseSummary[] }[] = [];
    const usedIds = new Set<string>();

    for (const group of groups) {
      const items: ExerciseSummary[] = [];
      for (const exId of group.exerciseIds) {
        const s = summaryById.get(exId);
        if (s) {
          items.push(s);
          usedIds.add(exId);
        }
      }
      if (items.length > 0) {
        sections.push({ id: group.id, name: group.name, items });
      }
    }

    const ungrouped = summaries.filter((s) => !usedIds.has(s.exercise.id));
    if (ungrouped.length > 0) {
      sections.push({ id: '__ungrouped', name: 'Ungrouped', items: ungrouped });
    }

    return sections;
  }, [groups, summaries, summaryById]);

  function display(kg: number): string {
    const v = unit === 'lb' ? kgToLb(kg) : kg;
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }

  function handleUnitToggle(newUnit: 'kg' | 'lb') {
    updatePreferences({ weightUnit: newUnit });
  }

  const unitToggle = (
    <div className="flex rounded-lg overflow-hidden border border-gray-300">
      <button
        type="button"
        onClick={() => handleUnitToggle('kg')}
        className={`px-3 min-h-[36px] text-sm font-medium ${
          unit === 'kg' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
        }`}
      >
        kg
      </button>
      <button
        type="button"
        onClick={() => handleUnitToggle('lb')}
        className={`px-3 min-h-[36px] text-sm font-medium ${
          unit === 'lb' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
        }`}
      >
        lb
      </button>
    </div>
  );

  function renderRow(s: ExerciseSummary) {
    const trendUp = s.trend > 0.0001;
    const trendDown = s.trend < -0.0001;
    const trendColor = trendUp
      ? 'text-green-600'
      : trendDown
        ? 'text-red-600'
        : 'text-gray-400';
    const strokeColor = trendUp
      ? '#16A34A'
      : trendDown
        ? '#DC2626'
        : '#6366F1';
    const trendLabel = trendUp
      ? `+${display(s.trend)}`
      : trendDown
        ? display(s.trend)
        : '—';

    return (
      <li key={s.exercise.id}>
        <button
          type="button"
          onClick={() => navigate(`/progress/${s.exercise.id}`)}
          className="w-full bg-white rounded-xl shadow-sm px-3 py-2.5 flex items-center gap-3 min-h-[60px] text-left active:bg-gray-50"
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {s.exercise.name}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {s.sessions} {s.sessions === 1 ? 'session' : 'sessions'} · Best {display(s.bestMax)} {unit}
            </div>
          </div>

          <div className="w-16 h-8 flex-shrink-0">
            {s.spark.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={s.spark}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={strokeColor}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                —
              </div>
            )}
          </div>

          <div className="flex-shrink-0 text-right min-w-[64px]">
            <div className="text-sm font-semibold text-gray-900 tabular-nums">
              {display(s.latestMax)}
              <span className="text-xs text-gray-400 font-normal ml-0.5">{unit}</span>
            </div>
            <div className={`text-xs font-medium tabular-nums ${trendColor}`}>
              {trendLabel}
            </div>
          </div>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-gray-300 flex-shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </li>
    );
  }

  const hasGroups = groups.length > 0;

  return (
    <PageShell title="Progress" rightAction={unitToggle}>
      {summaries.length === 0 ? (
        <EmptyState message="Log a workout to start tracking progress" />
      ) : (
        <div className="flex flex-col gap-3">
          {hasGroups && (
            <div className="flex rounded-lg overflow-hidden border border-gray-300 bg-white self-start">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-4 min-h-[36px] text-sm font-medium ${
                  viewMode === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setViewMode('groups')}
                className={`px-4 min-h-[36px] text-sm font-medium border-l border-gray-300 ${
                  viewMode === 'groups'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                Groups
              </button>
            </div>
          )}

          {viewMode === 'all' || !hasGroups ? (
            <ul className="flex flex-col gap-2">
              {summaries.map(renderRow)}
            </ul>
          ) : (
            <div className="flex flex-col gap-5">
              {groupedSections.map((section) => (
                <section key={section.id}>
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                    {section.name}
                    <span className="ml-2 text-gray-400 normal-case tracking-normal font-normal">
                      {section.items.length}
                    </span>
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {section.items.map(renderRow)}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
