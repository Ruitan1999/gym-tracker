import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import WorkoutForm from '../components/workout/WorkoutForm';

function seed(trainingMode?: 'week' | 'rotation') {
  localStorage.setItem(
    'gym-tracker-data',
    JSON.stringify({
      exercises: [],
      workouts: [],
      groups: [
        { id: 'g', name: 'Push', exerciseIds: [], createdAt: '2026-01-01T00:00:00Z', days: [0] },
      ],
      preferences: trainingMode ? { trainingMode } : undefined,
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

describe('Home template list and training mode', () => {
  beforeEach(() => localStorage.clear());

  it('shows each template\'s weekdays in week mode', () => {
    seed();
    renderHome();
    expect(screen.getByText('MON')).toBeTruthy();
  });

  it('hides the weekdays in rotation mode, keeping the data', () => {
    seed('rotation');
    renderHome();
    expect(screen.queryByText('MON')).toBeNull();
    expect(screen.getByText('Push')).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem('gym-tracker-data')!);
    expect(stored.groups[0].days).toEqual([0]);
  });
});
