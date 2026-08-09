import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import LogWorkoutPage from '../pages/LogWorkoutPage';
import type { Workout, WorkoutEntry } from '../types';

const DRAFT_KEY = 'liftgauge.workoutDraft.v1';
const STORAGE_KEY = 'gym-tracker-data';

function entry(id: string, exerciseId: string): WorkoutEntry {
  return {
    id,
    exerciseId,
    sets: [{ setNumber: 1, reps: 8, weightKg: 40 }],
    done: true,
  };
}

function seedDraft(extra: Record<string, unknown> = {}) {
  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({
      date: '2026-07-30',
      entries: [entry('a', 'ex-push-001')],
      notes: '',
      collapsedIds: [],
      ...extra,
    }),
  );
}

function seedWorkout(w: Workout) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ workouts: [w], groups: [], dataVersion: 1 }),
  );
}

/** The session page — the title in its header is the rename target. */
function renderSession(route = '/workout/new') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppProvider>
        <Routes>
          <Route path="/workout/new" element={<LogWorkoutPage />} />
          <Route path="/workout/:id" element={<LogWorkoutPage />} />
        </Routes>
      </AppProvider>
    </MemoryRouter>,
  );
}

function savedWorkouts(): Workout[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw).workouts as Workout[]) : [];
}

function renameTo(value: string) {
  fireEvent.click(screen.getByRole('button', { name: /^(Rename|Name) this session$/ }));
  fireEvent.change(screen.getByPlaceholderText('e.g. Push Day A'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'SAVE →' }));
}

// A line-up that matches no existing template gets the "save as template?"
// prompt before the session is committed.
function saveSessionAndSkipTemplate() {
  fireEvent.click(screen.getByRole('button', { name: /Save Session →/ }));
  fireEvent.click(screen.getByRole('button', { name: 'NOT NOW' }));
}

describe('Naming a session from its title', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('falls back to the page title until the session is named', () => {
    seedDraft();
    renderSession();
    expect(screen.getByRole('button', { name: 'Name this session' })).toBeDefined();
    expect(screen.getByText('New Session')).toBeDefined();
  });

  it('replaces the title with the name and carries it onto the saved workout', () => {
    seedDraft();
    renderSession();

    renameTo('Push Day A');
    expect(screen.getByText('Push Day A')).toBeDefined();
    expect(screen.queryByText('New Session')).toBeNull();

    saveSessionAndSkipTemplate();
    expect(savedWorkouts()[0].name).toBe('Push Day A');
  });

  it('omits the name entirely when the session is left unnamed', () => {
    seedDraft();
    renderSession();

    saveSessionAndSkipTemplate();
    expect('name' in savedWorkouts()[0]).toBe(false);
  });

  it('clears the name again when the field is emptied', () => {
    seedDraft({ name: 'Leg Day' });
    renderSession();

    renameTo('  ');
    expect(screen.getByText('New Session')).toBeDefined();

    saveSessionAndSkipTemplate();
    expect('name' in savedWorkouts()[0]).toBe(false);
  });

  it('restores a name that was saved to the draft', () => {
    seedDraft({ name: 'Leg Day' });
    renderSession();
    expect(screen.getByText('Leg Day')).toBeDefined();
  });

  it('renames an already-saved workout without dropping its other fields', () => {
    const saved: Workout = {
      id: 'w1',
      date: '2026-07-29',
      name: 'Old Name',
      entries: [entry('a', 'ex-push-001')],
      notes: 'Rating: 7',
      createdAt: '2026-07-29T10:00:00.000Z',
    };
    seedWorkout(saved);
    renderSession('/workout/w1');

    renameTo('New Name');
    fireEvent.click(screen.getByRole('button', { name: /Update Session →/ }));

    const updated = savedWorkouts()[0];
    expect(updated.name).toBe('New Name');
    expect(updated.notes).toBe('Rating: 7');
    expect(updated.id).toBe('w1');
  });

  it('drops the name from a saved workout when it is cleared on edit', () => {
    const saved: Workout = {
      id: 'w1',
      date: '2026-07-29',
      name: 'Old Name',
      entries: [entry('a', 'ex-push-001')],
      createdAt: '2026-07-29T10:00:00.000Z',
    };
    seedWorkout(saved);
    renderSession('/workout/w1');

    renameTo('');
    fireEvent.click(screen.getByRole('button', { name: /Update Session →/ }));

    expect('name' in savedWorkouts()[0]).toBe(false);
  });
});
