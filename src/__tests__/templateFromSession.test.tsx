import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import LogWorkoutPage from '../pages/LogWorkoutPage';
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

function seed(groups: WorkoutGroup[] = [template]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ workouts: [], groups, dataVersion: 1 }),
  );
}

/** Puts a session on screen as though it had been started from `sourceGroupId`. */
function seedDraft(exerciseIds: string[], sourceGroupId?: string) {
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
          <Route path="/" element={<LogWorkoutPage />} />
          <Route path="/workout/new" element={<LogWorkoutPage />} />
        </Routes>
      </AppProvider>
    </MemoryRouter>,
  );
}

/**
 * The home page alone, so the handed-over draft can be inspected. A mounted
 * session clears it again until something has actually been recorded.
 */
function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AppProvider>
        <Routes>
          <Route path="/" element={<LogWorkoutPage />} />
        </Routes>
      </AppProvider>
    </MemoryRouter>,
  );
}

function savedGroups(): WorkoutGroup[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? ((JSON.parse(raw).groups ?? []) as WorkoutGroup[]) : [];
}

function savedWorkoutCount(): number {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw).workouts ?? []).length : 0;
}

function save() {
  fireEvent.click(screen.getByRole('button', { name: /Save Session/ }));
}

describe('Finishing a session that started from a template', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves without prompting when the exercises are untouched', () => {
    seed();
    seedDraft([PUSH, BENCH], 'g1');
    renderSession();

    save();

    expect(screen.queryByText(/Update Push Day A/)).toBeNull();
    expect(savedWorkoutCount()).toBe(1);
    expect(savedGroups()).toHaveLength(1);
  });

  it('offers all three choices once an exercise is added', () => {
    seed();
    seedDraft([PUSH, BENCH, ROW], 'g1');
    renderSession();

    save();

    expect(screen.getByText('Update Push Day A?')).toBeDefined();
    expect(screen.getByRole('button', { name: /UPDATE TEMPLATE/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /SAVE AS NEW TEMPLATE/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /LEAVE TEMPLATE AS IS/ })).toBeDefined();
  });

  it('prompts when an exercise is removed', () => {
    seed();
    seedDraft([PUSH], 'g1');
    renderSession();

    save();

    expect(screen.getByText('Update Push Day A?')).toBeDefined();
  });

  it('prompts when the exercises are only reordered', () => {
    seed();
    seedDraft([BENCH, PUSH], 'g1');
    renderSession();

    save();

    expect(screen.getByText('Update Push Day A?')).toBeDefined();
  });

  it('rewrites the template in place, keeping its id and name', () => {
    seed();
    seedDraft([PUSH, BENCH, ROW], 'g1');
    renderSession();

    save();
    fireEvent.click(screen.getByRole('button', { name: /UPDATE TEMPLATE/ }));

    const groups = savedGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe('g1');
    expect(groups[0].name).toBe('Push Day A');
    expect(groups[0].exerciseIds).toEqual([PUSH, BENCH, ROW]);
    expect(savedWorkoutCount()).toBe(1);
  });

  it('leaves the original alone when saved as a new template', () => {
    seed();
    seedDraft([PUSH, BENCH, ROW], 'g1');
    renderSession();

    save();
    fireEvent.click(screen.getByRole('button', { name: /SAVE AS NEW TEMPLATE/ }));
    const input = screen.getByPlaceholderText('e.g. LEG DAY A') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Push Day B' } });
    fireEvent.click(screen.getByRole('button', { name: /^SAVE/ }));

    const groups = savedGroups();
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.id === 'g1')!.exerciseIds).toEqual([PUSH, BENCH]);
    const added = groups.find((g) => g.id !== 'g1')!;
    expect(added.name).toBe('Push Day B');
    expect(added.exerciseIds).toEqual([PUSH, BENCH, ROW]);
    expect(savedWorkoutCount()).toBe(1);
  });

  it('still logs the workout when the template is left as is', () => {
    seed();
    seedDraft([PUSH, BENCH, ROW], 'g1');
    renderSession();

    save();
    fireEvent.click(screen.getByRole('button', { name: /LEAVE TEMPLATE AS IS/ }));

    const groups = savedGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].exerciseIds).toEqual([PUSH, BENCH]);
    expect(savedWorkoutCount()).toBe(1);
  });

  it('falls back to the plain save-as-template prompt when the template is gone', () => {
    // Deleted mid-session: there is nothing left to update.
    seed([]);
    seedDraft([PUSH, BENCH, ROW], 'g1');
    renderSession();

    save();

    expect(screen.getByText('Save as template?')).toBeDefined();
    expect(screen.queryByRole('button', { name: /UPDATE TEMPLATE/ })).toBeNull();
  });

  it('asks to save a new template when the session began from scratch', () => {
    seed();
    seedDraft([PUSH, BENCH, ROW]);
    renderSession();

    save();

    expect(screen.getByText('Save as template?')).toBeDefined();
    expect(screen.queryByRole('button', { name: /UPDATE TEMPLATE/ })).toBeNull();
  });
});

describe('Starting a session from a template', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('hands the template id over in the draft', () => {
    seed();
    renderHome();

    // Anchored, so the card's own menu button ("Actions for Push Day A")
    // doesn't match too.
    fireEvent.click(screen.getByRole('button', { name: /^Push Day A/ }));

    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY)!);
    expect(draft.sourceGroupId).toBe('g1');
    expect(draft.entries.map((e: WorkoutEntry) => e.exerciseId)).toEqual([PUSH, BENCH]);
  });

  it('does not start the session when the card menu is opened', () => {
    seed();
    renderHome();

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Push Day A' }));

    expect(screen.getByRole('menuitem', { name: 'RENAME' })).toBeDefined();
    expect(screen.getByRole('menuitem', { name: 'EDIT EXERCISES' })).toBeDefined();
    expect(screen.getByRole('menuitem', { name: 'DELETE' })).toBeDefined();
    // Starting would have written a draft to hand over.
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('renames a template from the card menu', () => {
    seed();
    renderHome();

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Push Day A' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'RENAME' }));
    const input = screen.getByPlaceholderText('Name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Chest Day' } });
    fireEvent.click(screen.getByRole('button', { name: /SAVE/ }));

    const groups = savedGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe('g1');
    expect(groups[0].name).toBe('Chest Day');
    expect(groups[0].exerciseIds).toEqual([PUSH, BENCH]);
  });

  it('deletes a template from the card menu, once confirmed', () => {
    seed();
    renderHome();

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Push Day A' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'DELETE' }));
    fireEvent.click(screen.getByRole('button', { name: /DELETE/ }));

    expect(savedGroups()).toHaveLength(0);
  });

  it('keeps the template when the delete is dismissed', () => {
    seed();
    renderHome();

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Push Day A' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'DELETE' }));
    fireEvent.click(screen.getByRole('button', { name: 'KEEP' }));

    expect(savedGroups()).toHaveLength(1);
  });

  it('keeps the template id in the draft as the session is worked on', () => {
    // Survives a reload mid-session: the id has to be re-persisted alongside
    // everything else, not just read once at mount.
    seed();
    seedDraft([PUSH, BENCH], 'g1');
    renderSession();

    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).sourceGroupId).toBe('g1');
  });
});
