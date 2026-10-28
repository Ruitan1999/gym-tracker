import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import LogWorkoutPage from '../pages/LogWorkoutPage';
import type { WorkoutEntry } from '../types';

const STORAGE_KEY = 'gym-tracker-data';
const DRAFT_KEY = 'liftgauge.workoutDraft.v1';

const entries: WorkoutEntry[] = [
  {
    id: 'e1',
    exerciseId: 'ex-push-001',
    sets: [
      { setNumber: 1, reps: 10, weightKg: 50 },
      { setNumber: 2, reps: 10, weightKg: 50 },
    ],
    done: true,
  },
  {
    id: 'e2',
    exerciseId: 'ex-push-008',
    sets: [
      { setNumber: 1, reps: 8, weightKg: 20 },
      { setNumber: 2, reps: 0, weightKg: 20 },
    ],
  },
  {
    id: 'e3',
    exerciseId: 'ex-pull-006',
    sets: [{ setNumber: 1, reps: 0, weightKg: 0 }],
  },
];

function seed(collapsedIds: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ workouts: [], groups: [], dataVersion: 1 }));
  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({
      date: '2026-08-10',
      name: 'Push',
      entries,
      notes: '',
      collapsedIds,
      startedAt: new Date().toISOString(),
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

const strip = () => within(screen.getByTestId('session-strip'));

beforeEach(() => {
  localStorage.clear();
  // jsdom has no layout, so the scroll is observed through the window fallback.
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

describe('session strip', () => {
  it('shows sets done, volume and one chip per exercise', () => {
    seed([]);
    renderSession();

    expect(strip().getByText(/3\/5 sets/)).toBeTruthy();
    // 10x50 + 10x50 + 8x20
    expect(strip().getByText('1.2K kg')).toBeTruthy();
    expect(strip().getAllByRole('button')).toHaveLength(3);
  });

  it('labels chips with position, name, progress and state', () => {
    seed([]);
    renderSession();

    expect(
      strip().getByRole('button', { name: 'Exercise 1 of 3, Bench Press, 2 of 2 sets, done' }),
    ).toBeTruthy();
    expect(
      strip().getByRole('button', {
        name: 'Exercise 2 of 3, Dumbbell Bench Press, 1 of 2 sets, not done',
      }),
    ).toBeTruthy();
  });

  it('rings the first exercise not done', () => {
    seed([]);
    renderSession();

    const chips = strip().getAllByRole('button');
    expect(chips[0].getAttribute('data-current')).toBeNull();
    expect(chips[1].getAttribute('data-current')).toBe('true');
    expect(chips[2].getAttribute('data-current')).toBeNull();
  });

  it('tapping a chip opens that card, leaves the others folded, and scrolls to it', () => {
    seed(['e1', 'e2', 'e3']);
    renderSession();
    expect(screen.queryAllByRole('button', { name: 'Collapse exercise' })).toHaveLength(0);

    fireEvent.click(strip().getByRole('button', { name: /Exercise 3 of 3/ }));

    expect(screen.getAllByRole('button', { name: 'Collapse exercise' })).toHaveLength(1);
    expect(window.scrollTo).toHaveBeenCalled();
    // The tapped chip is now the current one.
    expect(
      strip().getByRole('button', { name: /Exercise 3 of 3/ }).getAttribute('data-current'),
    ).toBe('true');
  });

  it('never removes a set when a chip is tapped', () => {
    seed([]);
    renderSession();

    fireEvent.click(strip().getByRole('button', { name: /Exercise 2 of 3/ }));

    expect(strip().getByText(/3\/5 sets/)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).entries[1].sets).toHaveLength(2);
  });
});
