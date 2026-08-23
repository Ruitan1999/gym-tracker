import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import HistoryPage from '../pages/HistoryPage';

const STORAGE_KEY = 'gym-tracker-data';
const NOW = new Date('2026-08-22T10:00:00');

/** One session per given date, which is all the calendar looks at. */
function seed(dates: string[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      exercises: [],
      workouts: dates.map((date, i) => ({
        id: `w${i}`,
        date,
        entries: [
          { id: `e${i}`, exerciseId: 'x', sets: [{ setNumber: 1, reps: 5, weightKg: 60 }] },
        ],
        createdAt: `${date}T12:00:00.000Z`,
      })),
      groups: [],
      dataVersion: 1,
    }),
  );
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <HistoryPage />
      </AppProvider>
    </MemoryRouter>,
  );
}

const monthHeader = () => screen.getByRole('button', { name: /2026|2025/ });
const click = (el: HTMLElement) => fireEvent.click(el);
const prev = () => screen.getByLabelText('Previous month');
const next = () => screen.getByLabelText('Next month');

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(NOW);
});

afterEach(() => vi.useRealTimers());

describe('flicking back through the calendar', () => {
  it('starts on this month', () => {
    seed(['2026-08-03', '2026-06-10']);
    renderPage();
    expect(monthHeader().textContent).toContain('AUGUST 2026');
  });

  it('steps back a month at a time', () => {
    seed(['2026-08-03', '2026-06-10']);
    renderPage();

    click(prev());
    expect(monthHeader().textContent).toContain('JULY 2026');
    click(prev());
    expect(monthHeader().textContent).toContain('JUNE 2026');
  });

  it('counts the days trained in the month being shown, not this one', () => {
    seed(['2026-08-03', '2026-06-10', '2026-06-12', '2026-06-14']);
    renderPage();

    expect(screen.getByText(/01 DAY TRAINED/)).toBeTruthy();

    click(prev());
    click(prev());

    expect(screen.getByText(/03 DAYS TRAINED/)).toBeTruthy();
  });

  it('crosses back over a year boundary', () => {
    seed(['2026-08-03', '2025-12-10']);
    renderPage();

    for (let i = 0; i < 8; i++) click(prev());

    expect(monthHeader().textContent).toContain('DECEMBER 2025');
  });

  it('stops at the first session rather than falling off the end', () => {
    seed(['2026-08-03', '2026-07-01']);
    renderPage();

    click(prev());
    expect(monthHeader().textContent).toContain('JULY 2026');
    expect((prev() as HTMLButtonElement).disabled).toBe(true);
  });

  it('will not browse into the future', () => {
    seed(['2026-08-03']);
    renderPage();
    expect((next() as HTMLButtonElement).disabled).toBe(true);
  });

  it('offers a way back to today, only once you have moved', () => {
    seed(['2026-08-03', '2026-05-10']);
    renderPage();

    expect(monthHeader().textContent).not.toContain('TODAY');

    click(prev());
    expect(monthHeader().textContent).toContain('TODAY');

    click(monthHeader());
    expect(monthHeader().textContent).toContain('AUGUST 2026');
    expect(monthHeader().textContent).not.toContain('TODAY');
  });

  it('keeps the session list showing everything, whatever month is on the calendar', () => {
    seed(['2026-08-03', '2026-06-10']);
    const { container } = renderPage();

    click(prev());

    // The calendar browses; the log below it is still the whole log.
    expect(within(container).getAllByText(/AUGUST 2026/).length).toBeGreaterThan(0);
  });
});
