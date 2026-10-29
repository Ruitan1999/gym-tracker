import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import StreakCard from '../components/workout/StreakCard';

// Wednesday 28 October 2026.
const WED = new Date('2026-10-28T10:00:00');

function seed(workoutDates: string[], days?: number[][], trainingMode?: 'rotation') {
  localStorage.setItem(
    'gym-tracker-data',
    JSON.stringify({
      exercises: [],
      workouts: workoutDates.map((date, i) => ({
        id: `w${i}`,
        date,
        entries: [],
        createdAt: `${date}T12:00:00Z`,
      })),
      groups: (days ?? []).map((d, i) => ({
        id: `g${i}`,
        name: `T${i}`,
        exerciseIds: [],
        createdAt: '2026-01-01T00:00:00Z',
        days: d,
      })),
      preferences: trainingMode ? { trainingMode } : undefined,
      dataVersion: 1,
    }),
  );
}

function renderCard() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <StreakCard />
      </AppProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(WED);
});
afterEach(() => vi.useRealTimers());

describe('StreakCard', () => {
  it('says the streak, this week against the plan, and the total', () => {
    seed(['2026-10-26', '2026-10-21', '2026-10-14'], [[0], [2], [4]]);
    renderCard();
    expect(screen.getByText('3 week streak')).toBeTruthy();
    expect(screen.getByText(/1 \/ 3 this week · 3 workouts total/)).toBeTruthy();
  });

  it('leaves out the target when nothing is planned', () => {
    seed(['2026-10-26'], [[0], [2]], 'rotation');
    renderCard();
    expect(screen.getByText(/^1 this week · 1 workout total/)).toBeTruthy();
  });

  it('invites a start instead of showing a zero streak', () => {
    seed([]);
    renderCard();
    expect(screen.getByText('Start a streak this week')).toBeTruthy();
  });

  it('opens the Log Book from its calendar button', () => {
    seed([]);
    renderCard();
    expect(screen.getByRole('link', { name: 'Open Log Book' }).getAttribute('href')).toBe('/history');
  });
});
