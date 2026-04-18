import { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import type { ExerciseCategory } from '../../types';

interface ExerciseSelectProps {
  onSelect: (exerciseId: string) => void;
  onClose: () => void;
}

const CATEGORY_ORDER: ExerciseCategory[] = ['push', 'pull', 'legs', 'core', 'cardio'];
const CATEGORY_CODE: Record<ExerciseCategory, string> = {
  push: 'PSH',
  pull: 'PLL',
  legs: 'LEG',
  core: 'COR',
  cardio: 'CRD',
};
const CATEGORY_ACCENT: Record<ExerciseCategory, string> = {
  push: 'var(--color-volt)',
  pull: 'var(--color-ember)',
  legs: 'var(--color-rust)',
  core: 'var(--color-volt)',
  cardio: 'var(--color-ember)',
};

export default function ExerciseSelect({ onSelect, onClose }: ExerciseSelectProps) {
  const { appData } = useAppContext();
  const [filter, setFilter] = useState('');

  const recentExerciseIds = useMemo(() => {
    const seen = new Set<string>();
    const recent: string[] = [];
    const sorted = [...appData.workouts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    for (const w of sorted.slice(0, 10)) {
      for (const entry of w.entries) {
        if (!seen.has(entry.exerciseId)) {
          seen.add(entry.exerciseId);
          recent.push(entry.exerciseId);
        }
      }
      if (recent.length >= 10) break;
    }
    return recent;
  }, [appData.workouts]);

  const recentExercises = useMemo(
    () => recentExerciseIds
      .map((id) => appData.exercises.find((e) => e.id === id))
      .filter(Boolean),
    [recentExerciseIds, appData.exercises]
  );

  const isSearching = filter.length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const lower = filter.toLowerCase();
    return appData.exercises.filter((e) => e.name.toLowerCase().includes(lower));
  }, [appData.exercises, filter, isSearching]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, typeof appData.exercises> = {};
    for (const cat of CATEGORY_ORDER) {
      groups[cat] = appData.exercises.filter((e) => e.category === cat);
    }
    return groups;
  }, [appData.exercises]);

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(5,5,5,0.72)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      <div
        className="fixed inset-x-0 bottom-0 z-50 h-[88dvh] flex flex-col animate-[slideUp_0.22s_ease-out]"
        style={{
          background: 'var(--color-elev)',
          borderTop: '1px solid var(--color-line-2)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1.5">
          <div className="w-10 h-[3px]" style={{ background: 'var(--color-line-3)' }} />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3 flex items-end justify-between">
          <div>
            <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text)' }}>
              INDEX EXERCISE
            </div>
            <h3
              className="font-display mt-1"
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--color-text)',
              }}
            >
              Add to session
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-3 caps-tight text-[10px] press"
            style={{ color: 'var(--color-text-muted)' }}
          >
            CLOSE ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <input
            type="text"
            placeholder="SEARCH TYPE TO FILTER"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
            className="w-full h-12 px-3 font-mono outline-none"
            style={{
              background: 'var(--color-ink)',
              border: '1px solid var(--color-line-2)',
              borderRadius: '2px',
              fontSize: '15px',
              letterSpacing: '0.02em',
              color: 'var(--color-text)',
            }}
          />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {isSearching ? (
            <div>
              {searchResults.length === 0 ? (
                <div
                  className="text-center py-10 caps-tight text-[10px]"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  NO MATCH
                </div>
              ) : (
                <ul>
                  {searchResults.map((ex, i) => (
                    <li key={ex.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(ex.id)}
                        className="w-full text-left h-14 px-2 flex items-center gap-3 press"
                        style={{
                          borderBottom: '1px solid var(--color-line)',
                          borderTop: i === 0 ? '1px solid var(--color-line)' : undefined,
                        }}
                      >
                        <span
                          className="font-mono text-[10px] w-8"
                          style={{ color: 'var(--color-text-faint)' }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          className="flex-1 text-[15px]"
                          style={{ color: 'var(--color-text)', fontWeight: 500 }}
                        >
                          {ex.name}
                        </span>
                        <span
                          className="caps-tight text-[9px] px-2 py-0.5"
                          style={{
                            color: CATEGORY_ACCENT[ex.category],
                            border: `1px solid ${CATEGORY_ACCENT[ex.category]}`,
                            borderRadius: '2px',
                          }}
                        >
                          {CATEGORY_CODE[ex.category]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {recentExercises.length > 0 && (
                <div>
                  <div className="caps text-[10px] mb-2.5 flex items-center gap-3">
                    <span style={{ color: 'var(--color-text)' }}>00</span>
                    <span style={{ color: 'var(--color-text)' }}>RECENT</span>
                    <span className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentExercises.map((ex) => ex && (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => onSelect(ex.id)}
                        className="h-10 px-3 text-[13px] press"
                        style={{
                          background: 'transparent',
                          color: 'var(--color-text)',
                          border: '1px solid var(--color-volt)',
                          borderRadius: '2px',
                          fontWeight: 500,
                        }}
                      >
                        {ex.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {CATEGORY_ORDER.map((cat, idx) => {
                const list = groupedByCategory[cat];
                if (list.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="caps text-[10px] mb-2 flex items-center gap-3">
                      <span style={{ color: CATEGORY_ACCENT[cat] }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span style={{ color: 'var(--color-text)' }}>{cat.toUpperCase()}</span>
                      <span className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
                      <span className="font-mono text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                        {String(list.length).padStart(2, '0')}
                      </span>
                    </div>
                    <ul>
                      {list.map((ex, i) => (
                        <li key={ex.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(ex.id)}
                            className="w-full text-left h-12 px-2 flex items-center gap-3 press"
                            style={{
                              borderBottom: i < list.length - 1 ? '1px solid var(--color-line)' : undefined,
                            }}
                          >
                            <span
                              className="font-mono text-[10px] w-6"
                              style={{ color: 'var(--color-text-faint)' }}
                            >
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span
                              className="flex-1 text-[15px]"
                              style={{ color: 'var(--color-text)' }}
                            >
                              {ex.name}
                            </span>
                            <span
                              className="text-[11px]"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              →
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
