import { useState } from 'react';
import PageShell from '../components/layout/PageShell';
import { useAppContext } from '../context/AppContext';
import type { ExerciseCategory } from '../types';

const CATEGORIES: ExerciseCategory[] = ['push', 'pull', 'legs', 'core', 'cardio'];

const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  push: 'bg-blue-500',
  pull: 'bg-violet-500',
  legs: 'bg-red-500',
  core: 'bg-amber-500',
  cardio: 'bg-green-500',
};

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
  cardio: 'Cardio',
};

export default function ExerciseLibraryPage() {
  const { appData, addExercise, deleteExercise } = useAppContext();

  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('push');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;

    addExercise({
      id: crypto.randomUUID(),
      name: trimmed,
      category: newCategory,
      isCustom: true,
    });
    setNewName('');
  }

  function toggleCategory(cat: ExerciseCategory) {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  const exercisesByCategory = CATEGORIES.map((cat) => ({
    category: cat,
    exercises: appData.exercises.filter((e) => e.category === cat),
  }));

  return (
    <PageShell title="Exercise Library" showBack>
      <div className="flex flex-col gap-4">
        {/* Add custom exercise form */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500 mb-2">
            Add Custom Exercise
          </h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Exercise name"
              className="min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg text-[16px] text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as ExerciseCategory)}
              className="min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg text-[16px] text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAdd}
              className="min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* Exercise list grouped by category */}
        {exercisesByCategory.map(({ category, exercises }) => (
          <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 min-h-[44px]"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`${CATEGORY_COLORS[category]} text-white text-xs font-semibold px-2 py-0.5 rounded-full`}
                >
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="text-sm text-gray-500">
                  ({exercises.length})
                </span>
              </div>
              <span className="text-gray-400 text-sm">
                {collapsed[category] ? '+' : '-'}
              </span>
            </button>

            {!collapsed[category] && exercises.length > 0 && (
              <ul className="border-t border-gray-100 divide-y divide-gray-100">
                {exercises.map((exercise) => (
                  <li
                    key={exercise.id}
                    className="flex items-center justify-between px-4 py-3 min-h-[44px]"
                  >
                    <div>
                      <span className="text-base text-gray-900">
                        {exercise.name}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {CATEGORY_LABELS[exercise.category]}
                      </span>
                    </div>
                    {exercise.isCustom && (
                      <button
                        type="button"
                        onClick={() => {
                          const deleted = deleteExercise(exercise.id);
                          if (!deleted) {
                            alert('This exercise is used in existing workouts and cannot be deleted.');
                          }
                        }}
                        className="text-red-600 text-sm font-medium min-h-[44px] px-2"
                      >
                        Delete
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {!collapsed[category] && exercises.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-400 border-t border-gray-100">
                No exercises in this category
              </p>
            )}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
