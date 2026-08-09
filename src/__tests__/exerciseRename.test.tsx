import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import LogWorkoutPage from '../pages/LogWorkoutPage';
import type { Exercise, Workout } from '../types';

const DRAFT_KEY = 'liftgauge.workoutDraft.v1';
const STORAGE_KEY = 'gym-tracker-data';

function seedSession() {
  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({
      date: '2026-07-30',
      entries: [
        { id: 'a', exerciseId: 'ex-push-001', sets: [{ setNumber: 1, reps: 8, weightKg: 40 }], done: true },
      ],
      notes: '',
      collapsedIds: [],
    }),
  );
}

function renderSession() {
  return render(
    <MemoryRouter initialEntries={['/workout/new']}>
      <AppProvider>
        <Routes>
          <Route path="/workout/new" element={<LogWorkoutPage />} />
        </Routes>
      </AppProvider>
    </MemoryRouter>,
  );
}

function stored(): { exercises: Exercise[]; workouts: Workout[] } {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)!);
}

function openRename(from: string) {
  fireEvent.click(screen.getByRole('button', { name: `Actions for ${from}` }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'EDIT EXERCISE NAME' }));
}

function rename(from: string, to: string) {
  openRename(from);
  fireEvent.change(screen.getByPlaceholderText('Exercise name'), { target: { value: to } });
  fireEvent.click(screen.getByRole('button', { name: 'SAVE →' }));
}

describe('Renaming an exercise from the session', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renames it in place from the card menu', () => {
    seedSession();
    renderSession();

    expect(screen.getByText('Bench Press')).toBeDefined();
    rename('Bench Press', 'Barbell Bench');

    expect(screen.getByText('Barbell Bench')).toBeDefined();
    expect(screen.queryByText('Bench Press')).toBeNull();
  });

  it('keeps the exercise id so already-logged sessions follow the new name', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        workouts: [
          {
            id: 'w1',
            date: '2026-07-01',
            entries: [
              { id: 'x', exerciseId: 'ex-push-001', sets: [{ setNumber: 1, reps: 5, weightKg: 80 }], done: true },
            ],
            createdAt: '2026-07-01T10:00:00.000Z',
          },
        ],
        groups: [],
        dataVersion: 1,
      }),
    );
    seedSession();
    renderSession();

    rename('Bench Press', 'Barbell Bench');

    const data = stored();
    const renamed = data.exercises.find((e) => e.id === 'ex-push-001');
    expect(renamed?.name).toBe('Barbell Bench');
    expect(data.workouts[0].entries[0].exerciseId).toBe('ex-push-001');
  });

  it('will not blank out an exercise name', () => {
    seedSession();
    renderSession();

    openRename('Bench Press');
    fireEvent.change(screen.getByPlaceholderText('Exercise name'), { target: { value: '  ' } });
    expect((screen.getByRole('button', { name: 'SAVE →' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('leaves tapping the card header as the fold toggle', () => {
    seedSession();
    renderSession();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse exercise' }));
    expect(screen.getByRole('button', { name: 'Expand exercise' })).toBeDefined();
  });

  it('offers removal from the same menu', () => {
    seedSession();
    renderSession();

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Bench Press' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'REMOVE FROM SESSION' }));
    fireEvent.click(screen.getByRole('button', { name: 'REMOVE →' }));

    expect(screen.queryByText('Bench Press')).toBeNull();
  });
});
