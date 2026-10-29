import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import BottomNav from '../components/layout/BottomNav';
import { DRAFT_KEY, loadDraft, saveDraft, type Draft } from '../utils/templateSession';

const STORAGE_KEY = 'gym-tracker-data';

/** A Thursday, index 3 in the Monday-first week. */
const THURSDAY = new Date('2026-08-27T09:00:00');

function seed({ days, workouts = [] as unknown[] }: { days?: number[]; workouts?: unknown[] } = {}) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      exercises: [{ id: 'a', name: 'Bench Press', bodyPart: 'chest', isCustom: true }],
      workouts,
      groups: days
        ? [{ id: 'push', name: 'Push Day A', exerciseIds: ['a'], createdAt: '2026-01-01T00:00:00Z', days }]
        : [],
      dataVersion: 1,
    }),
  );
}

function Where() {
  const location = useLocation();
  return (
    <div data-testid="where" data-state={JSON.stringify(location.state)}>
      {location.pathname}
    </div>
  );
}

function renderNav() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AppProvider>
        <Routes>
          <Route path="*" element={<Where />} />
        </Routes>
        <BottomNav />
      </AppProvider>
    </MemoryRouter>,
  );
}

const inProgress: Draft = {
  date: '2026-08-27',
  name: 'Half done',
  entries: [
    {
      id: 'e1',
      exerciseId: 'a',
      sets: [{ setNumber: 1, reps: 8, weightKg: 60 }],
    },
  ],
  notes: '',
  collapsedIds: [],
  sourceGroupId: 'other',
};

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(THURSDAY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('bottom nav', () => {
  it('has five items with Start in the middle', () => {
    seed();
    renderNav();

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const items = Array.from(nav.querySelectorAll('a, button')).map(
      (el) => el.getAttribute('aria-label') ?? el.textContent,
    );
    expect(items).toEqual(['Log', 'Plan', 'Start workout', 'Log Book', 'Progress']);
  });

  it('opens the template due today', () => {
    seed({ days: [3] });
    renderNav();

    fireEvent.click(screen.getByRole('button', { name: 'Start workout' }));

    expect(screen.getByTestId('where').textContent).toBe('/workout/new');
    const draft = loadDraft();
    expect(draft?.name).toBe('Push Day A');
    expect(draft?.sourceGroupId).toBe('push');
    expect(draft?.entries.map((e) => e.exerciseId)).toEqual(['a']);
  });

  it('opens the exercise picker when nothing is due today', () => {
    seed({ days: [5] });
    renderNav();

    fireEvent.click(screen.getByRole('button', { name: 'Start workout' }));

    const where = screen.getByTestId('where');
    expect(where.textContent).toBe('/workout/new');
    expect(JSON.parse(where.getAttribute('data-state')!)).toEqual({ autoOpenSelect: true });
    expect(loadDraft()).toBeNull();
  });

  it('opens the picker rather than a second template once today is logged', () => {
    seed({
      days: [3],
      workouts: [
        { id: 'w1', date: '2026-08-27', name: 'Earlier', entries: [], createdAt: '2026-08-27T07:00:00Z' },
      ],
    });
    renderNav();

    fireEvent.click(screen.getByRole('button', { name: 'Start workout' }));

    expect(JSON.parse(screen.getByTestId('where').getAttribute('data-state')!)).toEqual({
      autoOpenSelect: true,
    });
    expect(loadDraft()).toBeNull();
  });

  it('resumes a session in progress without touching the draft', () => {
    seed({ days: [3] });
    saveDraft(inProgress);
    const before = localStorage.getItem(DRAFT_KEY);
    renderNav();

    // With a session open the button says so, since Home no longer does.
    expect(screen.queryByRole('button', { name: 'Start workout' })).toBeNull();
    const resume = screen.getByRole('button', { name: 'Resume workout' });
    expect(resume.textContent).toContain('Resume');
    fireEvent.click(resume);

    const where = screen.getByTestId('where');
    expect(where.textContent).toBe('/workout/new');
    expect(JSON.parse(where.getAttribute('data-state')!)).toBeNull();
    expect(localStorage.getItem(DRAFT_KEY)).toBe(before);
  });

  it('says Start when there is nothing in progress', () => {
    seed({ days: [3] });
    renderNav();

    expect(screen.getByRole('button', { name: 'Start workout' }).textContent).toContain('Start');
    expect(screen.queryByRole('button', { name: 'Resume workout' })).toBeNull();
  });

  it('still navigates with the other tabs', () => {
    seed();
    renderNav();

    fireEvent.click(screen.getByRole('link', { name: /Progress/ }));
    expect(screen.getByTestId('where').textContent).toBe('/progress');
  });
});
