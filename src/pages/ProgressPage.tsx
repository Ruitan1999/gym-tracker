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
  trend: number;
  lastDate: string;
  spark: { value: number }[];
}

type ViewMode = 'all' | 'groups';

export default function ProgressPage() {
  const { appData } = useAppContext();
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

  function renderRow(s: ExerciseSummary) {
    const trendUp = s.trend > 0.0001;
    const trendDown = s.trend < -0.0001;
    const trendColor = trendUp
      ? 'var(--color-volt)'
      : trendDown
        ? 'var(--color-rust)'
        : 'var(--color-text-faint)';
    const strokeColor = trendUp
      ? 'var(--color-volt)'
      : trendDown
        ? 'var(--color-rust)'
        : 'var(--color-volt)';
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
          className="w-full text-left card press flex items-center gap-3 px-4 py-3 min-h-[64px]"
        >
          <div className="flex-1 min-w-0">
            <p
              className="font-display truncate leading-tight"
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                letterSpacing: '-0.015em',
                fontVariationSettings: '"wdth" 95',
                color: 'var(--color-text)',
              }}
            >
              {s.exercise.name}
            </p>
            <div
              className="caps-tight text-[9px] mt-1"
              style={{ color: 'var(--color-text-faint)' }}
            >
              {String(s.sessions).padStart(2, '0')} SESSION{s.sessions === 1 ? '' : 'S'} · BEST {display(s.bestMax)} {unit.toUpperCase()}
            </div>
          </div>

          <div className="w-16 h-8 shrink-0">
            {s.spark.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={s.spark}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={strokeColor}
                    strokeWidth={1.75}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="w-full h-full flex items-center justify-center caps-tight text-[9px]"
                style={{ color: 'var(--color-text-faint)' }}
              >
                —
              </div>
            )}
          </div>

          <div className="shrink-0 text-right min-w-[64px]">
            <div
              className="font-mono leading-none"
              style={{
                fontSize: '1.125rem',
                fontWeight: 500,
                color: 'var(--color-volt)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {display(s.latestMax)}
              <span
                className="caps-tight text-[9px] ml-1"
                style={{ color: 'var(--color-text-faint)' }}
              >
                {unit.toUpperCase()}
              </span>
            </div>
            <div
              className="font-mono text-[11px] mt-1"
              style={{
                color: trendColor,
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 500,
              }}
            >
              {trendLabel}
            </div>
          </div>
        </button>
      </li>
    );
  }

  const hasGroups = groups.length > 0;

  if (summaries.length === 0) {
    return (
      <PageShell title="Progress">
        <EmptyState message="Log a workout to start tracking progress" />
      </PageShell>
    );
  }

  return (
    <PageShell title="Progress">
      <div className="flex flex-col gap-5">
        {hasGroups && (
          <div className="flex self-start" role="tablist" aria-label="View mode">
            <ToggleBtn
              active={viewMode === 'all'}
              onClick={() => setViewMode('all')}
              label="ALL"
            />
            <ToggleBtn
              active={viewMode === 'groups'}
              onClick={() => setViewMode('groups')}
              label="GROUPS"
            />
          </div>
        )}

        {viewMode === 'all' || !hasGroups ? (
          <ul className="flex flex-col gap-2">{summaries.map(renderRow)}</ul>
        ) : (
          <div className="flex flex-col gap-6">
            {groupedSections.map((section) => (
              <section key={section.id}>
                <h2
                  className="caps text-[10px] mb-3 flex items-center gap-3"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <span>{section.name}</span>
                  <span
                    className="flex-1 h-px"
                    style={{ background: 'var(--color-line)' }}
                  />
                  <span style={{ color: 'var(--color-text-faint)' }}>
                    {String(section.items.length).padStart(2, '0')}
                  </span>
                </h2>
                <ul className="flex flex-col gap-2">{section.items.map(renderRow)}</ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function ToggleBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className="caps-tight text-[10px] px-4 h-9 press"
      style={{
        background: active ? 'var(--color-text)' : 'var(--color-surface)',
        color: active ? '#ffffff' : 'var(--color-text-muted)',
        border: '1px solid',
        borderColor: active ? 'var(--color-text)' : 'var(--color-line-2)',
      }}
    >
      {label}
    </button>
  );
}
