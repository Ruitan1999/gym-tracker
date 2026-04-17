import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import EmptyState from '../components/shared/EmptyState';
import { useAppContext } from '../context/AppContext';
import type { WorkoutGroup } from '../types';

export default function GroupsPage() {
  const { appData, updateGroup, deleteGroup, reorderGroups } = useAppContext();
  const groups = appData.groups ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  function startEdit(g: WorkoutGroup) {
    setEditingId(g.id);
    setEditName(g.name);
  }

  function saveEdit(g: WorkoutGroup) {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    updateGroup({ ...g, name: trimmed });
    setEditingId(null);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= groups.length) return;
    const ids = groups.map((g) => g.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderGroups(ids);
  }

  function handleDelete(g: WorkoutGroup) {
    if (confirm(`Delete "${g.name}"? This won't affect saved workouts.`)) {
      deleteGroup(g.id);
    }
  }

  if (groups.length === 0) {
    return (
      <PageShell title="Workout Groups" showBack>
        <EmptyState
          message="No saved groups yet"
          action={
            <Link
              to="/"
              className="inline-flex items-center justify-center bg-blue-600 text-white rounded-lg min-h-[44px] px-6 font-medium"
            >
              Log a Workout
            </Link>
          }
        />
        <p className="text-xs text-gray-400 text-center mt-4">
          Add exercises to a workout and tap "Save as group" to create one.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Workout Groups" showBack>
      <ul className="flex flex-col gap-2">
        {groups.map((g, index) => {
          const isEditing = editingId === g.id;
          const names = g.exerciseIds
            .map((id) => appData.exercises.find((e) => e.id === id)?.name)
            .filter(Boolean);
          return (
            <li key={g.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => saveEdit(g)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(g);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 min-h-[40px] px-2 py-1 border border-gray-300 rounded-lg text-[16px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(g)}
                    className="flex-1 text-left text-base font-semibold text-gray-900 min-h-[40px]"
                  >
                    {g.name}
                  </button>
                )}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="w-9 h-9 rounded-full text-gray-500 disabled:opacity-30 active:bg-gray-100"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={index === groups.length - 1}
                    onClick={() => move(index, 1)}
                    className="w-9 h-9 rounded-full text-gray-500 disabled:opacity-30 active:bg-gray-100"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(g)}
                    className="w-9 h-9 rounded-full text-red-600 active:bg-red-50"
                    aria-label={`Delete ${g.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {names.length === 0 ? 'No exercises' : names.join(', ')}
              </p>
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
