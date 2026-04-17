import { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import type { ExerciseCategory } from '../../types';

interface ExerciseSelectProps {
  onSelect: (exerciseId: string) => void;
  onClose: () => void;
}

const CATEGORY_ORDER: ExerciseCategory[] = ['push', 'pull', 'legs', 'core', 'cardio'];
const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  push: 'bg-blue-100 text-blue-700',
  pull: 'bg-violet-100 text-violet-700',
  legs: 'bg-red-100 text-red-700',
  core: 'bg-amber-100 text-amber-700',
  cardio: 'bg-green-100 text-green-700',
};

export default function ExerciseSelect({ onSelect, onClose }: ExerciseSelectProps) {
  const { appData } = useAppContext();
  const [filter, setFilter] = useState('');

  // Recently used exercises (from last 10 workouts)
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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Bottom sheet — fixed height so it doesn't jump around as results change */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl h-[85dvh] flex flex-col animate-[slideUp_0.2s_ease-out]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Add Exercise</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 text-sm font-medium min-h-[44px] px-2"
          >
            Cancel
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <input
            type="text"
            placeholder="Search exercises..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
            className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg text-[16px] text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {isSearching ? (
            /* Search results */
            <div>
              {searchResults.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No exercises found</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {searchResults.map((ex) => (
                    <li key={ex.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(ex.id)}
                        className="w-full text-left px-2 py-3 min-h-[44px] flex items-center gap-3 active:bg-gray-50 rounded-lg"
                      >
                        <span className="text-[16px] text-gray-900 flex-1">{ex.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[ex.category]}`}>
                          {ex.category}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            /* Default view: recent + categories */
            <div className="flex flex-col gap-4">
              {/* Recent */}
              {recentExercises.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent</h4>
                  <div className="flex flex-wrap gap-2">
                    {recentExercises.map((ex) => ex && (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => onSelect(ex.id)}
                        className="px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-full min-h-[36px] active:bg-blue-100"
                      >
                        {ex.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {CATEGORY_ORDER.map((cat) => (
                <div key={cat}>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {cat}
                  </h4>
                  <ul className="divide-y divide-gray-100">
                    {groupedByCategory[cat].map((ex) => (
                      <li key={ex.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(ex.id)}
                          className="w-full text-left px-2 py-2.5 min-h-[44px] text-[16px] text-gray-900 active:bg-gray-50 rounded-lg"
                        >
                          {ex.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
