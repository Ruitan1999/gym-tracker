import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import WorkoutForm from '../components/workout/WorkoutForm';

const DRAFT_KEY = 'liftgauge.workoutDraft.v1';

function seedTemplates() {
  localStorage.setItem(
    'gym-tracker-data',
    JSON.stringify({
      exercises: [],
      workouts: [],
      groups: [{ id: 'g', name: 'Push', exerciseIds: [], createdAt: '2026-01-01T00:00:00Z' }],
      dataVersion: 1,
    }),
  );
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AppProvider>
        <WorkoutForm name="" onNameChange={() => {}} />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('Home with templates has no floating start bar', () => {
  beforeEach(() => localStorage.clear());

  it('leaves starting to the bottom nav', () => {
    seedTemplates();
    renderHome();
    expect(screen.queryByRole('button', { name: /START WORKOUT/ })).toBeNull();
    expect(screen.queryByText(/LOG WORKOUT/)).toBeNull();
  });

  it('shows no in-progress bar either when a session is under way', () => {
    seedTemplates();
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        date: '2026-07-30',
        entries: [
          { id: 'a', exerciseId: 'x', sets: [{ setNumber: 1, reps: 8, weightKg: 60 }] },
        ],
        notes: '',
        collapsedIds: [],
      }),
    );
    renderHome();
    expect(screen.queryByText(/WORKOUT IN PROGRESS/)).toBeNull();
  });
});
