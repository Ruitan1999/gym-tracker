import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import WorkoutDetailPage from '../pages/WorkoutDetailPage';
import type { Workout, WorkoutGroup } from '../types';

const STORAGE_KEY = 'gym-tracker-data';

const workout: Workout = {
  id: 'w1',
  date: '2026-07-29',
  name: 'Push Day A',
  entries: [
    { id: 'a', exerciseId: 'ex-push-001', sets: [{ setNumber: 1, reps: 8, weightKg: 60 }], done: true },
    { id: 'b', exerciseId: 'ex-push-002', sets: [{ setNumber: 1, reps: 8, weightKg: 40 }], done: true },
    // Same exercise revisited later in the session.
    { id: 'c', exerciseId: 'ex-push-001', sets: [{ setNumber: 1, reps: 6, weightKg: 65 }], done: true },
  ],
  createdAt: '2026-07-29T10:00:00.000Z',
};

function seed(w: Workout) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ workouts: [w], groups: [], dataVersion: 1 }),
  );
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/history/w1']}>
      <AppProvider>
        <Routes>
          <Route path="/history/:id" element={<WorkoutDetailPage />} />
        </Routes>
      </AppProvider>
    </MemoryRouter>,
  );
}

function savedGroups(): WorkoutGroup[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw).groups as WorkoutGroup[]) : [];
}

describe('Saving a logged workout as a template', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prefills the template name with the session name', () => {
    seed(workout);
    renderDetail();

    fireEvent.click(screen.getByRole('button', { name: /SAVE AS TEMPLATE/ }));

    const input = screen.getByPlaceholderText('e.g. Push Day A') as HTMLInputElement;
    expect(input.value).toBe('Push Day A');
  });

  it('creates a template from the session line-up, keeping each exercise once', () => {
    seed(workout);
    renderDetail();

    fireEvent.click(screen.getByRole('button', { name: /SAVE AS TEMPLATE/ }));
    fireEvent.click(screen.getByRole('button', { name: 'SAVE →' }));

    const groups = savedGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Push Day A');
    expect(groups[0].exerciseIds).toEqual(['ex-push-001', 'ex-push-002']);
  });

  it('lets an unnamed session be saved under a name of its own', () => {
    const unnamed = { ...workout };
    delete unnamed.name;
    seed(unnamed);
    renderDetail();

    fireEvent.click(screen.getByRole('button', { name: /SAVE AS TEMPLATE/ }));
    const input = screen.getByPlaceholderText('e.g. Push Day A') as HTMLInputElement;
    expect(input.value).toBe('');

    fireEvent.change(input, { target: { value: '  Chest Day  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'SAVE →' }));

    expect(savedGroups()[0].name).toBe('Chest Day');
  });

  it('will not save a template with no name', () => {
    const unnamed = { ...workout };
    delete unnamed.name;
    seed(unnamed);
    renderDetail();

    fireEvent.click(screen.getByRole('button', { name: /SAVE AS TEMPLATE/ }));
    fireEvent.click(screen.getByRole('button', { name: 'SAVE →' }));

    expect(savedGroups()).toHaveLength(0);
  });
});
