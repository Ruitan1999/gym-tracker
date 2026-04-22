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
      <PageShell title="Workout Template" showBack>
        <EmptyState
          message="No template saved"
          description="SAVE ANY WORKOUT AS GROUP TO REUSE"
          action={
            <Link
              to="/"
              className="flex w-full items-center justify-center h-12 px-6 caps-tight text-[11px] btn-volt press"
              style={{ borderRadius: '2px' }}
            >
              START WORKOUT →
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="Workout Template" showBack>
      <ul className="flex flex-col gap-2">
        {groups.map((g, index) => {
          const isEditing = editingId === g.id;
          const names = g.exerciseIds
            .map((id) => appData.exercises.find((e) => e.id === id)?.name)
            .filter(Boolean);
          return (
            <li key={g.id} className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="font-mono text-[11px]"
                  style={{ color: 'var(--color-text)' }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
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
                    className="flex-1 h-10 px-2 font-display outline-none"
                    style={{
                      background: 'var(--color-ink)',
                      border: '1px solid var(--color-line-2)',
                      borderRadius: '2px',
                      fontSize: '16px',
                      color: 'var(--color-text)',
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(g)}
                    className="flex-1 text-left font-display press"
                    style={{
                      fontSize: '1.0625rem',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      color: 'var(--color-text)',
                    }}
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
                    className="w-12 h-12 press disabled:opacity-20 flex items-center justify-center text-[20px]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={index === groups.length - 1}
                    onClick={() => move(index, 1)}
                    className="w-12 h-12 press disabled:opacity-20 flex items-center justify-center text-[20px]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(g)}
                    className="w-12 h-12 press flex items-center justify-center text-[18px]"
                    style={{ color: 'var(--color-rust)' }}
                    aria-label={`Delete ${g.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div
                className="caps-tight text-[9px] mb-1"
                style={{ color: 'var(--color-text-faint)' }}
              >
                {String(names.length).padStart(2, '0')} EXERCISES
              </div>
              <p
                className="text-[13px]"
                style={{ color: 'var(--color-text-muted)', letterSpacing: '-0.005em' }}
              >
                {names.length === 0 ? '— empty —' : names.join(' ')}
              </p>
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
