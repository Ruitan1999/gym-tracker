import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import WorkoutForm from '../components/workout/WorkoutForm';
import type { WorkoutEntry, WorkoutSet } from '../types';

const DRAFT_KEY = 'liftgauge.workoutDraft.v1';

function entry(id: string, exerciseId: string, sets: WorkoutSet[]): WorkoutEntry {
  return { id, exerciseId, sets };
}

/** What picking an exercise creates: a set shell with nothing recorded in it. */
const emptySets: WorkoutSet[] = [
  { setNumber: 1, reps: 0, weightKg: 0 },
  { setNumber: 2, reps: 0, weightKg: 0 },
];

function seedDraft(entries: WorkoutEntry[], notes = '') {
  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({ date: '2026-07-30', entries, notes, collapsedIds: [] }),
  );
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProvider>
        <WorkoutForm name="" onNameChange={() => {}} />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('A session only counts as in progress once something is recorded', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not claim a session is running when only empty sets exist', () => {
    seedDraft([entry('a', 'ex-push-001', emptySets)]);
    renderAt('/');

    expect(screen.queryByText(/WORKOUT IN PROGRESS/)).toBeNull();
    expect(screen.getByText(/LOG WORKOUT/)).toBeDefined();
  });

  it('claims a session is running once a rep is recorded', () => {
    seedDraft([
      entry('a', 'ex-push-001', [
        { setNumber: 1, reps: 8, weightKg: 0 },
        { setNumber: 2, reps: 0, weightKg: 0 },
      ]),
    ]);
    renderAt('/');

    expect(screen.getByText(/WORKOUT IN PROGRESS/)).toBeDefined();
  });

  it('claims a session is running once a weight is recorded', () => {
    seedDraft([entry('a', 'ex-push-001', [{ setNumber: 1, reps: 0, weightKg: 60 }])]);
    renderAt('/');

    expect(screen.getByText(/WORKOUT IN PROGRESS/)).toBeDefined();
  });

  it('counts an RPE rating as input', () => {
    seedDraft([entry('a', 'ex-push-001', emptySets)], 'Rating: 7');
    renderAt('/');

    expect(screen.getByText(/WORKOUT IN PROGRESS/)).toBeDefined();
  });

  it('does not persist a session that has nothing recorded in it', () => {
    // Leaving the page is not an explicit discard, so this is what stops an
    // abandoned session reappearing the next time Start Workout is tapped.
    seedDraft([entry('a', 'ex-push-001', emptySets)]);
    renderAt('/workout/new');

    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('persists the session as soon as something is recorded', () => {
    seedDraft([entry('a', 'ex-push-001', [{ setNumber: 1, reps: 8, weightKg: 60 }])]);
    renderAt('/workout/new');

    expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();
  });

  it('backs straight out of an untouched session without asking', () => {
    seedDraft([entry('a', 'ex-push-001', emptySets)]);
    renderAt('/workout/new');

    fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));

    expect(screen.queryByText(/Discard this workout/)).toBeNull();
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('still confirms before discarding a session with recorded work', () => {
    seedDraft([entry('a', 'ex-push-001', [{ setNumber: 1, reps: 8, weightKg: 60 }])]);
    renderAt('/workout/new');

    fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));

    expect(screen.getByText(/Discard this workout/)).toBeDefined();
    expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();
  });
});
