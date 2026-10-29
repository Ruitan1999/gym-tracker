import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import HomeBalanceCard from '../components/workout/HomeBalanceCard';

const NOW = new Date('2026-10-28T10:00:00');

const sets = (n: number) => Array.from({ length: n }, (_, i) => ({ setNumber: i + 1, reps: 8, weightKg: 40 }));

function seed(workouts: { date: string; exerciseId: string; n: number }[]) {
  localStorage.setItem(
    'gym-tracker-data',
    JSON.stringify({
      exercises: [
        { id: 'bench', name: 'Bench', bodyPart: 'chest', isCustom: true },
        { id: 'squat', name: 'Squat', bodyPart: 'legs', isCustom: true },
      ],
      workouts: workouts.map((w, i) => ({
        id: `w${i}`,
        date: w.date,
        entries: [{ id: `e${i}`, exerciseId: w.exerciseId, sets: sets(w.n), done: true }],
        createdAt: `${w.date}T12:00:00Z`,
      })),
      groups: [],
      dataVersion: 1,
    }),
  );
}

function renderCard() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <HomeBalanceCard />
      </AppProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

describe('HomeBalanceCard', () => {
  it('stays away until something has been logged', () => {
    seed([]);
    const { container } = renderCard();
    expect(container.textContent).toBe('');
  });

  it('shades the last 30 days only, with no switch', () => {
    seed([
      { date: '2026-10-20', exerciseId: 'bench', n: 3 },
      { date: '2026-08-20', exerciseId: 'squat', n: 4 },
    ]);
    renderCard();
    expect(screen.getByRole('img', { name: /last 30 days: chest 3 sets$/ })).toBeTruthy();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('lists the sets per part beside the figure, most first', () => {
    seed([
      { date: '2026-10-20', exerciseId: 'bench', n: 3 },
      { date: '2026-10-21', exerciseId: 'squat', n: 5 },
    ]);
    renderCard();
    expect(screen.getByText('Muscle groups · last 30 days')).toBeTruthy();
    const rows = screen.getAllByRole('listitem', { hidden: true }).map((li) => li.textContent);
    expect(rows).toEqual(['LEGS5 sets', 'CHEST3 sets']);
  });
});
