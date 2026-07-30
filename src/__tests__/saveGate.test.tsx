import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import WorkoutForm from '../components/workout/WorkoutForm';
import type { Workout, WorkoutEntry } from '../types';

const DRAFT_KEY = 'liftgauge.workoutDraft.v1';

function entry(id: string, exerciseId: string, done?: boolean): WorkoutEntry {
  return {
    id,
    exerciseId,
    sets: [{ setNumber: 1, reps: 8, weightKg: 40 }],
    ...(done === undefined ? {} : { done }),
  };
}

function seedDraft(entries: WorkoutEntry[]) {
  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({ date: '2026-07-30', entries, notes: '', collapsedIds: [] }),
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

function saveButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: /Session →/ }) as HTMLButtonElement;
}

describe('Save gating on exercise completion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('blocks saving while any exercise is unmarked', () => {
    seedDraft([entry('a', 'ex-push-001', true), entry('b', 'ex-push-002')]);
    renderForm();
    expect(saveButton().disabled).toBe(true);
    expect(screen.getByText('1 EXERCISE LEFT TO MARK DONE')).toBeDefined();
  });

  it('pluralises the remaining count', () => {
    seedDraft([entry('a', 'ex-push-001'), entry('b', 'ex-push-002')]);
    renderForm();
    expect(screen.getByText('2 EXERCISES LEFT TO MARK DONE')).toBeDefined();
  });

  it('unblocks saving once every exercise is marked done', () => {
    seedDraft([entry('a', 'ex-push-001', true), entry('b', 'ex-push-002')]);
    renderForm();
    expect(saveButton().disabled).toBe(true);

    fireEvent.click(screen.getAllByRole('button', { name: 'Mark exercise done' })[0]);

    expect(saveButton().disabled).toBe(false);
    expect(screen.getByText('ALL EXERCISES DONE')).toBeDefined();
  });

  it('re-blocks saving when an exercise is unmarked again', () => {
    seedDraft([entry('a', 'ex-push-001', true)]);
    renderForm();
    expect(saveButton().disabled).toBe(false);

    fireEvent.click(screen.getAllByRole('button', { name: 'Mark exercise not done' })[0]);

    expect(saveButton().disabled).toBe(true);
  });

  it('leaves an empty session on its existing validation rather than the gate', () => {
    seedDraft([]);
    renderForm();
    expect(saveButton().disabled).toBe(false);

    fireEvent.click(saveButton());

    expect(screen.getByText(/Add at least one exercise/)).toBeDefined();
  });

  it('treats entries of an already-saved workout as done so edits stay savable', () => {
    const saved: Workout = {
      id: 'w1',
      date: '2026-07-29',
      // Predates the `done` field entirely.
      entries: [entry('a', 'ex-push-001'), entry('b', 'ex-push-002')],
      createdAt: '2026-07-29T10:00:00.000Z',
    };
    renderForm(saved);
    expect(saveButton().disabled).toBe(false);
    expect(screen.getByText('ALL EXERCISES DONE')).toBeDefined();
  });
});
