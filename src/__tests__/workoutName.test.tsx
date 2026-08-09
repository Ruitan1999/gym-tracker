import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import WorkoutForm from '../components/workout/WorkoutForm';
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

function renderForm(existingWorkout?: Workout) {
  return render(
    <MemoryRouter initialEntries={['/workout/new']}>
      <AppProvider>
        <WorkoutForm existingWorkout={existingWorkout} />
      </AppProvider>
    </MemoryRouter>,
  );
}

function savedWorkouts(): Workout[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw).workouts as Workout[]) : [];
}

// A line-up that matches no existing template gets the "save as template?"
// prompt before the session is committed.
function saveSessionAndSkipTemplate() {
  fireEvent.click(screen.getByRole('button', { name: /Save Session →/ }));
  fireEvent.click(screen.getByRole('button', { name: 'NOT NOW' }));
}

function rename(value: string) {
  fireEvent.click(screen.getByText('Name this session'));
  fireEvent.change(screen.getByPlaceholderText('e.g. Push Day A'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'SAVE →' }));
}

describe('Naming a session while it is underway', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('offers a placeholder until the session is named', () => {
    seedDraft();
    renderForm();
    expect(screen.getByText('Name this session')).toBeDefined();
  });

  it('shows the name once set and carries it onto the saved workout', () => {
    seedDraft();
    renderForm();

    rename('Push Day A');
    expect(screen.getByText('Push Day A')).toBeDefined();

    saveSessionAndSkipTemplate();
    expect(savedWorkouts()[0].name).toBe('Push Day A');
  });

  it('trims the name and omits it entirely when left blank', () => {
    seedDraft();
    renderForm();

    saveSessionAndSkipTemplate();
    expect('name' in savedWorkouts()[0]).toBe(false);
  });

  it('restores a name that was saved to the draft', () => {
    seedDraft({ name: 'Leg Day' });
    renderForm();
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
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ workouts: [saved], groups: [], dataVersion: 1 }),
    );
    renderForm(saved);

    fireEvent.click(screen.getByText('Old Name'));
    fireEvent.change(screen.getByPlaceholderText('e.g. Push Day A'), {
      target: { value: 'New Name' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'SAVE →' }));
    fireEvent.click(screen.getByRole('button', { name: /Update Session →/ }));

    const updated = savedWorkouts()[0];
    expect(updated.name).toBe('New Name');
    expect(updated.notes).toBe('Rating: 7');
    expect(updated.id).toBe('w1');
  });
});
