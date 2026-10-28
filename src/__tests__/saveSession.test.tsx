import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import LogWorkoutPage from '../pages/LogWorkoutPage';
import WorkoutDetailPage from '../pages/WorkoutDetailPage';
import { readTemplateOffer } from '../utils/templateOffer';
import type { WorkoutEntry, WorkoutGroup } from '../types';

const STORAGE_KEY = 'gym-tracker-data';
const DRAFT_KEY = 'liftgauge.workoutDraft.v1';

const PUSH = 'ex-push-001';
const BENCH = 'ex-push-008';
const ROW = 'ex-pull-006';

const template: WorkoutGroup = {
  id: 'g1',
  name: 'Push Day A',
  exerciseIds: [PUSH, BENCH],
  createdAt: '2026-07-01T10:00:00.000Z',
};

function entry(exerciseId: string): WorkoutEntry {
  return {
    id: `e-${exerciseId}`,
    exerciseId,
    sets: [{ setNumber: 1, reps: 8, weightKg: 60 }],
    done: true,
  };
}

function seed(exerciseIds: string[], sourceGroupId?: string) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ workouts: [], groups: [template], dataVersion: 1 }),
  );
  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({
      date: '2026-08-10',
      name: 'Push Day A',
      entries: exerciseIds.map(entry),
      notes: '',
      collapsedIds: [],
      ...(sourceGroupId ? { sourceGroupId } : {}),
    }),
  );
}

function renderSession() {
  return render(
    <MemoryRouter initialEntries={['/workout/new']}>
      <AppProvider>
        <Routes>
          <Route path="/workout/new" element={<LogWorkoutPage />} />
          <Route path="/history/:id" element={<WorkoutDetailPage />} />
        </Routes>
      </AppProvider>
    </MemoryRouter>,
  );
}

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
const save = () => fireEvent.click(screen.getByRole('button', { name: /Save Session/ }));
/** The saved session is on screen once its own page is. */
const onSavedSession = () => screen.queryAllByText(/LOGGED/).length > 0;
const prompt = () => screen.queryByRole('dialog');

beforeEach(() => localStorage.clear());

/**
 * Pressing save ends the session. What becomes of the template is a separate
 * question, asked afterwards, and no answer to it — including none at all —
 * can leave the session unsaved or put it back on screen as though it were
 * still running.
 */
describe('what pressing Save Session guarantees', () => {
  it('writes the session there and then', () => {
    seed([PUSH, BENCH, ROW], 'g1');
    renderSession();

    save();

    expect(stored().workouts).toHaveLength(1);
  });

  it('leaves the session behind for the page of the session just saved', () => {
    seed([PUSH, BENCH, ROW], 'g1');
    renderSession();

    save();

    expect(onSavedSession()).toBe(true);
    // Not the live session: its clock has no business still running.
    expect(screen.queryByTestId('session-strip')).toBeNull();
  });

  it('clears the draft, so nothing is waiting to be resumed', () => {
    seed([PUSH, BENCH, ROW], 'g1');
    renderSession();

    save();

    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('asks about the template over the saved session, not in front of it', () => {
    seed([PUSH, BENCH, ROW], 'g1');
    renderSession();

    save();

    expect(prompt()).not.toBeNull();
    expect(onSavedSession()).toBe(true);
  });

  it('stays on the saved session once the template is left as is', () => {
    seed([PUSH, BENCH, ROW], 'g1');
    renderSession();

    save();
    fireEvent.click(screen.getByRole('button', { name: /LEAVE TEMPLATE AS IS/ }));

    expect(prompt()).toBeNull();
    expect(onSavedSession()).toBe(true);
    expect(stored().workouts).toHaveLength(1);
    expect(stored().groups).toHaveLength(1);
  });

  it('stays on the saved session once the template is updated', () => {
    seed([PUSH, BENCH, ROW], 'g1');
    renderSession();

    save();
    fireEvent.click(screen.getByRole('button', { name: /UPDATE TEMPLATE/ }));

    expect(onSavedSession()).toBe(true);
    expect(stored().groups[0].exerciseIds).toEqual([PUSH, BENCH, ROW]);
    expect(stored().workouts).toHaveLength(1);
  });

  it('stays on the saved session once a new template is kept', () => {
    seed([PUSH, BENCH, ROW], 'g1');
    renderSession();

    save();
    fireEvent.click(screen.getByRole('button', { name: /SAVE AS NEW TEMPLATE/ }));
    fireEvent.change(screen.getByPlaceholderText('e.g. LEG DAY A'), {
      target: { value: 'Push Day B' },
    });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^SAVE →/ }));

    expect(onSavedSession()).toBe(true);
    expect(stored().groups).toHaveLength(2);
    expect(stored().workouts).toHaveLength(1);
  });

  it('keeps the session when the question is never answered', () => {
    seed([PUSH, BENCH, ROW], 'g1');
    renderSession();

    save();
    // Walking away from the prompt is an answer about the template only.
    fireEvent.click(screen.getByRole('button', { name: /LEAVE TEMPLATE AS IS/ }));

    expect(stored().workouts).toHaveLength(1);
    expect(stored().groups).toHaveLength(1);
  });

  it('goes straight through when there is nothing to ask', () => {
    seed([PUSH, BENCH], 'g1');
    renderSession();

    save();

    expect(prompt()).toBeNull();
    expect(onSavedSession()).toBe(true);
    expect(stored().workouts).toHaveLength(1);
  });
});

describe('the template question carried across the navigation', () => {
  it('is read back off a navigation that carries one', () => {
    expect(readTemplateOffer({ offerTemplate: { exerciseIds: ['a'] } })).toEqual({
      exerciseIds: ['a'],
    });
  });

  it('is nothing at all for anything else', () => {
    expect(readTemplateOffer(null)).toBeNull();
    expect(readTemplateOffer({})).toBeNull();
    expect(readTemplateOffer({ offerTemplate: {} })).toBeNull();
    expect(readTemplateOffer({ offerTemplate: { exerciseIds: [] } })).toBeNull();
    expect(readTemplateOffer('offerTemplate')).toBeNull();
  });
});
