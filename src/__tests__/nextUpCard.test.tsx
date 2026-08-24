import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import NextUpCard from '../components/workout/NextUpCard';
import { loadDraft } from '../utils/templateSession';

const STORAGE_KEY = 'gym-tracker-data';

/** A Thursday, so "today" is a weekday with days either side of it. */
const THURSDAY = new Date('2026-08-27T09:00:00');

interface Group {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: string;
  days?: number[];
}

function seed({ groups = [] as Group[], workouts = [] as unknown[] } = {}) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      exercises: [
        { id: 'a', name: 'Bench Press', bodyPart: 'chest', isCustom: true },
        { id: 'b', name: 'Barbell Row', bodyPart: 'back', isCustom: true },
      ],
      workouts,
      groups,
      dataVersion: 1,
    }),
  );
}

const push = (days?: number[]): Group => ({
  id: 'push',
  name: 'Push Day A',
  exerciseIds: ['a'],
  createdAt: '2026-01-01T00:00:00Z',
  ...(days ? { days } : {}),
});

const pull = (days?: number[]): Group => ({
  id: 'pull',
  name: 'Pull Day',
  exerciseIds: ['b'],
  createdAt: '2026-01-01T00:00:00Z',
  ...(days ? { days } : {}),
});

function renderCard() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <NextUpCard />
      </AppProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(THURSDAY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the day a template is due', () => {
  it('offers the one set for today', () => {
    // Thursday is index 3.
    seed({ groups: [push([0, 3]), pull([2, 5])] });
    renderCard();

    expect(screen.getByText('Push Day A')).toBeTruthy();
    expect(screen.getByText(/TODAY · THU/)).toBeTruthy();
    // The card itself is the button — there is no separate START WORKOUT bar.
    expect(screen.getByRole('button', { name: /Push Day A/ })).toBeTruthy();
  });

  it('hands the session to the form when it is started', () => {
    seed({ groups: [push([3])] });
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: /Push Day A/ }));

    const draft = loadDraft();
    expect(draft?.name).toBe('Push Day A');
    expect(draft?.sourceGroupId).toBe('push');
    expect(draft?.entries.map((e) => e.exerciseId)).toEqual(['a']);
    // Folded, the way starting from the list leaves them.
    expect(draft?.collapsedIds).toHaveLength(1);
  });

  it('offers the second one underneath when two share the day', () => {
    seed({ groups: [push([3]), pull([3])] });
    renderCard();

    expect(screen.getByRole('button', { name: /Push Day A/ })).toBeTruthy();
    const also = screen.getByRole('button', { name: /Pull Day/ });
    expect(also.textContent).toContain('ALSO TODAY');
  });

  it('starts the second one too', () => {
    seed({ groups: [push([3]), pull([3])] });
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: /Pull Day/ }));
    expect(loadDraft()?.sourceGroupId).toBe('pull');
  });
});

describe('a day with nothing set for it', () => {
  it('names the next one due and how far off it is', () => {
    // Thursday, with the next template on Saturday.
    seed({ groups: [pull([5])] });
    renderCard();

    expect(screen.getByText('Pull Day')).toBeTruthy();
    expect(screen.getByText('SATURDAY')).toBeTruthy();
  });

  it('says tomorrow rather than naming the day', () => {
    seed({ groups: [pull([4])] });
    renderCard();
    expect(screen.getByText(/TOMORROW · FRI/)).toBeTruthy();
  });

  it('still lets the owner train it early', () => {
    seed({ groups: [pull([5])] });
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: /START EARLY/ }));
    expect(loadDraft()?.sourceGroupId).toBe('pull');
  });
});

describe('a session already logged today', () => {
  it('steps back rather than asking for another', () => {
    seed({
      groups: [push([3])],
      workouts: [
        {
          id: 'w1',
          date: '2026-08-27',
          createdAt: '2026-08-27T10:00:00Z',
          name: 'Push Day A',
          entries: [{ id: 'e1', exerciseId: 'a', sets: [{ setNumber: 1, reps: 5, weightKg: 60 }] }],
        },
      ],
    });
    renderCard();

    expect(screen.getByText('DONE TODAY')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /START WORKOUT/ })).toBeNull();
    expect(screen.getByRole('button', { name: /VIEW SESSION/ })).toBeTruthy();
  });

  it('counts what was done', () => {
    seed({
      groups: [push([3])],
      workouts: [
        {
          id: 'w1',
          date: '2026-08-27',
          createdAt: '2026-08-27T10:00:00Z',
          name: 'Push Day A',
          entries: [
            {
              id: 'e1',
              exerciseId: 'a',
              sets: [
                { setNumber: 1, reps: 5, weightKg: 60 },
                { setNumber: 2, reps: 5, weightKg: 60 },
              ],
            },
          ],
        },
      ],
    });
    renderCard();

    expect(screen.getByText('1 exercise · 2 sets')).toBeTruthy();
  });
});

describe('before any days are set', () => {
  it('asks for them instead of showing an empty card', () => {
    seed({ groups: [push(), pull()] });
    renderCard();

    expect(screen.getByRole('button', { name: /SET WORKOUT DAYS/ })).toBeTruthy();
  });

  it('says nothing at all when there are no templates yet', () => {
    seed({ groups: [] });
    const { container } = renderCard();

    // A brand new account has an empty state of its own; this card keeps quiet.
    expect(container.textContent).toBe('');
  });
});
