import { useRef, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import { useAppContext } from '../context/AppContext';
import type { ExerciseCategory } from '../types';

const CATEGORIES: ExerciseCategory[] = ['push', 'pull', 'legs', 'core', 'cardio'];

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  push: 'PUSH',
  pull: 'PULL',
  legs: 'LEGS',
  core: 'CORE',
  cardio: 'CARDIO',
};

const CATEGORY_ACCENT: Record<ExerciseCategory, string> = {
  push: 'var(--color-volt)',
  pull: 'var(--color-ember)',
  legs: 'var(--color-rust)',
  core: 'var(--color-volt)',
  cardio: 'var(--color-ember)',
};

export default function ExerciseLibraryPage() {
  const { appData, addExercise, deleteExercise } = useAppContext();

  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('push');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  function handleInputFocus() {
    window.setTimeout(() => {
      nameInputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 300);
  }

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
    <PageShell title="Exercise Index" eyebrow="LIBRARY CATALOG" showBack>
      <div className="flex flex-col gap-6">
        {/* Add custom exercise form */}
        <section className="card p-4">
          <div className="caps text-[10px] mb-3 flex items-center gap-2">
            <span style={{ color: 'var(--color-text)' }}>＋</span>
            <span style={{ color: 'var(--color-text)' }}>ADD CUSTOM</span>
          </div>
          <div className="flex flex-col gap-2.5">
            <input
              ref={nameInputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Exercise name"
              enterKeyHint="done"
              className="h-12 px-3 outline-none scroll-mt-24"
              style={{
                background: 'var(--color-ink)',
                border: '1px solid var(--color-line-2)',
                borderRadius: '2px',
                fontSize: '16px',
                color: 'var(--color-text)',
              }}
            />
            <div className="grid grid-cols-5 gap-1">
              {CATEGORIES.map((cat) => {
                const active = newCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    className="h-11 caps-tight text-[10px] press"
                    style={{
                      background: active ? CATEGORY_ACCENT[cat] : 'transparent',
                      color: active ? '#ffffff' : 'var(--color-text)',
                      border: `1px solid ${active ? CATEGORY_ACCENT[cat] : 'var(--color-line-2)'}`,
                      borderRadius: '2px',
                      fontWeight: 600,
                    }}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="h-12 btn-volt press caps-tight text-[11px] disabled:opacity-40"
              style={{ borderRadius: '2px' }}
            >
              ADD TO INDEX →
            </button>
          </div>
        </section>

        {/* Exercise list grouped */}
        {exercisesByCategory.map(({ category, exercises }, idx) => (
          <section key={category}>
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center gap-3 mb-3 press"
            >
              <span
                className="caps text-[10px]"
                style={{ color: CATEGORY_ACCENT[category] }}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="caps text-[10px]" style={{ color: 'var(--color-text)' }}>
                {CATEGORY_LABELS[category]}
              </span>
              <span className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
              <span className="font-mono text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                {String(exercises.length).padStart(2, '0')}
              </span>
              <span className="caps-tight text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                {collapsed[category] ? '▸' : '▾'}
              </span>
            </button>

            {!collapsed[category] && exercises.length > 0 && (
              <ul>
                {exercises.map((exercise, i) => (
                  <li
                    key={exercise.id}
                    className="flex items-center h-12"
                    style={{
                      borderTop: i === 0 ? '1px solid var(--color-line)' : undefined,
                      borderBottom: '1px solid var(--color-line)',
                    }}
                  >
                    <span
                      className="font-mono text-[10px] w-8 pl-1"
                      style={{ color: 'var(--color-text-faint)' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className="flex-1 text-[15px]"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {exercise.name}
                    </span>
                    {exercise.isCustom && (
                      <button
                        type="button"
                        onClick={() => {
                          const deleted = deleteExercise(exercise.id);
                          if (!deleted) {
                            alert('This exercise is used in existing workouts and cannot be deleted.');
                          }
                        }}
                        className="h-12 px-3 caps-tight text-[10px] press"
                        style={{ color: 'var(--color-rust)' }}
                      >
                        DEL
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {!collapsed[category] && exercises.length === 0 && (
              <p
                className="caps-tight text-[10px] py-4"
                style={{ color: 'var(--color-text-faint)' }}
              >
                — EMPTY CATEGORY —
              </p>
            )}
          </section>
        ))}
      </div>
    </PageShell>
  );
}
