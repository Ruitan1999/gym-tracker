import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import NextUpCard from '../components/workout/NextUpCard';

const STORAGE_KEY = 'gym-tracker-data';
// A Thursday: index 3.
const THURSDAY = new Date('2026-08-27T09:00:00');

const group = (id: string, days?: number[]) => ({
  id,
  name: id,
  exerciseIds: ['a'],
  createdAt: '2026-01-01T00:00:00Z',
  ...(days ? { days } : {}),
});

function seed(groups: ReturnType<typeof group>[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      exercises: [{ id: 'a', name: 'Bench Press', bodyPart: 'chest', isCustom: true }],
      workouts: [],
      groups,
      dataVersion: 1,
    }),
  );
}

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>;
}

function renderCard() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AppProvider>
        <Routes>
          <Route path="*" element={<Where />} />
        </Routes>
        <NextUpCard />
      </AppProvider>
    </MemoryRouter>,
  );
}

const LINK = /choose a different workout/i;

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(THURSDAY);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Choose a different workout', () => {
  it('is hidden when the only template is the suggested one', () => {
    seed([group('push', [3])]);
    renderCard();
    expect(screen.queryByText(LINK)).toBeNull();
  });

  it('shows under a due suggestion when another template exists', () => {
    seed([group('push', [3]), group('pull', [5])]);
    renderCard();
    expect(screen.getByText(LINK)).toBeTruthy();
  });

  it('shows under a rest-day suggestion too', () => {
    seed([group('push', [5]), group('pull', [6])]);
    renderCard();
    expect(screen.getByText(LINK)).toBeTruthy();
  });

  it('opens Plan, where every template is, and changes nothing else', () => {
    seed([group('push', [3]), group('pull', [5])]);
    renderCard();
    const before = localStorage.getItem(STORAGE_KEY);
    const keysBefore = Object.keys(localStorage).sort();
    fireEvent.click(screen.getByText(LINK));
    expect(screen.getByTestId('where').textContent).toBe('/groups');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
    expect(Object.keys(localStorage).sort()).toEqual(keysBefore);
  });

  it('is a 44px target', () => {
    seed([group('push', [3]), group('pull', [5])]);
    renderCard();
    expect(screen.getByText(LINK).closest('button')!.className).toContain('h-11');
  });
});
