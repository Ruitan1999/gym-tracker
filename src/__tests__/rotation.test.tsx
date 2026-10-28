import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import NextUpCard from '../components/workout/NextUpCard';
import BottomNav from '../components/layout/BottomNav';
import GroupsPage from '../pages/GroupsPage';
import { loadDraft } from '../utils/templateSession';
import { nextInRotation, lastTrainedIndex, trainingModeOf } from '../utils/rotation';
import { selectNextUp } from '../utils/nextUp';
import { templateDueToday } from '../utils/startSession';
import type { Workout, WorkoutGroup } from '../types';

const STORAGE_KEY = 'gym-tracker-data';
const THURSDAY = new Date('2026-08-27T09:00:00');

const grp = (id: string, name: string, exerciseIds: string[], days?: number[]): WorkoutGroup => ({
  id,
  name,
  exerciseIds,
  createdAt: '2026-01-01T00:00:00Z',
  ...(days ? { days } : {}),
});

let n = 0;
const wo = (
  date: string,
  name: string | undefined,
  exerciseIds: string[] = ['a'],
  createdAt = `${date}T10:00:00Z`,
): Workout => ({
  id: `w${n++}`,
  date,
  ...(name !== undefined ? { name } : {}),
  entries: exerciseIds.map((exerciseId, i) => ({
    id: `e${n}-${i}`,
    exerciseId,
    sets: [{ setNumber: 1, reps: 5, weightKg: 20 }],
  })),
  createdAt,
});

const A = grp('A', 'Push', ['a']);
const B = grp('B', 'Pull', ['b']);
const C = grp('C', 'Legs', ['c']);

describe('rotation order', () => {
  it('is the template after the one trained last', () => {
    expect(nextInRotation([A, B, C], [wo('2026-08-20', 'Push')])?.id).toBe('B');
    expect(nextInRotation([A, B, C], [wo('2026-08-20', 'Pull')])?.id).toBe('C');
  });

  it('wraps from the last back to the first', () => {
    expect(nextInRotation([A, B, C], [wo('2026-08-20', 'Legs')])?.id).toBe('A');
  });

  it('starts at the first when nothing matches', () => {
    expect(nextInRotation([A, B, C], [])?.id).toBe('A');
    expect(nextInRotation([A, B, C], [wo('2026-08-20', 'Chest day', ['z'])])?.id).toBe('A');
  });

  it('uses the most recent workout by date, then by when it was saved', () => {
    const older = wo('2026-08-10', 'Legs');
    const newer = wo('2026-08-20', 'Push');
    expect(nextInRotation([A, B, C], [newer, older])?.id).toBe('B');
    const early = wo('2026-08-20', 'Push', ['a'], '2026-08-20T08:00:00Z');
    const late = wo('2026-08-20', 'Pull', ['b'], '2026-08-20T18:00:00Z');
    expect(nextInRotation([A, B, C], [late, early])?.id).toBe('C');
    expect(nextInRotation([A, B, C], [early, late])?.id).toBe('C');
  });

  it('skips a recent workout that matches nothing and uses an older one', () => {
    const ws = [wo('2026-08-25', 'Walk', ['z']), wo('2026-08-20', 'Pull')];
    expect(nextInRotation([A, B, C], ws)?.id).toBe('C');
  });

  it('matches names ignoring case and spacing', () => {
    expect(nextInRotation([A, B, C], [wo('2026-08-20', '  pUSH ')])?.id).toBe('B');
  });

  it('falls back to the same exercises when the name was changed', () => {
    const renamed = wo('2026-08-20', 'Chest and shoulders', ['b']);
    expect(nextInRotation([A, B, C], [renamed])?.id).toBe('C');
    // A workout with extra or missing exercises is not the same set.
    expect(lastTrainedIndex([A, B, C], [wo('2026-08-20', 'x', ['b', 'z'])])).toBe(-1);
    expect(lastTrainedIndex([A, B, C], [wo('2026-08-20', undefined, [])])).toBe(-1);
  });

  it('prefers the name over the exercises', () => {
    // Named Push but holds Pull exercises: the name wins.
    expect(nextInRotation([A, B, C], [wo('2026-08-20', 'Push', ['b'])])?.id).toBe('B');
  });

  it('follows a template that was renamed after the workout was saved, by exercises', () => {
    const renamedB = grp('B', 'Back day', ['b']);
    expect(nextInRotation([A, renamedB, C], [wo('2026-08-20', 'Pull', ['b'])])?.id).toBe('C');
  });

  it('takes the first listed of two templates sharing a name', () => {
    const dup = grp('A2', 'push', ['a2']);
    expect(nextInRotation([A, B, dup], [wo('2026-08-20', 'Push')])?.id).toBe('B');
  });

  it('ignores workouts from deleted templates', () => {
    // Legs was deleted: its old workout matches nothing, so the older Push counts.
    const ws = [wo('2026-08-25', 'Legs', ['c']), wo('2026-08-20', 'Push')];
    expect(nextInRotation([A, B], ws)?.id).toBe('B');
  });

  it('is the same template again with only one', () => {
    expect(nextInRotation([A], [wo('2026-08-20', 'Push')])?.id).toBe('A');
    expect(nextInRotation([A], [])?.id).toBe('A');
  });

  it('is nothing for an empty list', () => {
    expect(nextInRotation([], [wo('2026-08-20', 'Push')])).toBeNull();
    expect(lastTrainedIndex([], [])).toBe(-1);
  });

  it('reads an absent mode as the week', () => {
    expect(trainingModeOf(undefined)).toBe('week');
    expect(trainingModeOf({})).toBe('week');
    expect(trainingModeOf({ trainingMode: 'rotation' })).toBe('rotation');
  });
});

describe('Start agrees with the card', () => {
  const today = '2026-08-27';
  const scheduled = [grp('A', 'Push', ['a'], [3]), grp('B', 'Pull', ['b'], [1])];
  const cases: { name: string; groups: WorkoutGroup[]; workouts: Workout[] }[] = [
    { name: 'no templates', groups: [], workouts: [] },
    { name: 'fresh', groups: scheduled, workouts: [] },
    { name: 'after Push', groups: scheduled, workouts: [wo('2026-08-24', 'Push')] },
    { name: 'after Pull', groups: scheduled, workouts: [wo('2026-08-24', 'Pull')] },
    { name: 'trained today', groups: scheduled, workouts: [wo(today, 'Push')] },
    { name: 'rest day', groups: [grp('B', 'Pull', ['b'], [1])], workouts: [] },
    { name: 'no days', groups: [grp('A', 'Push', ['a'])], workouts: [] },
  ];

  for (const mode of ['week', 'rotation'] as const) {
    for (const c of cases) {
      it(`${mode}: ${c.name}`, () => {
        const pick = selectNextUp(c.groups, c.workouts, mode, 3, today);
        const expected =
          pick.kind === 'due' ? pick.first : pick.kind === 'rotation' ? pick.group : null;
        expect(templateDueToday(c.groups, c.workouts, 3, today, mode)?.id).toBe(expected?.id);
      });
    }
  }

  it('names the rotation template, ignoring weekdays', () => {
    expect(templateDueToday(scheduled, [wo('2026-08-24', 'Push')], 3, today, 'rotation')?.id).toBe('B');
    expect(templateDueToday(scheduled, [wo('2026-08-24', 'Push')], 3, today, 'week')?.id).toBe('A');
  });
});

function seed({
  groups = [] as WorkoutGroup[],
  workouts = [] as Workout[],
  trainingMode,
}: { groups?: WorkoutGroup[]; workouts?: Workout[]; trainingMode?: string } = {}) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      exercises: [
        { id: 'a', name: 'Bench Press', bodyPart: 'chest', isCustom: true },
        { id: 'b', name: 'Barbell Row', bodyPart: 'back', isCustom: true },
        { id: 'c', name: 'Squat', bodyPart: 'legs', isCustom: true },
      ],
      workouts,
      groups,
      ...(trainingMode ? { preferences: { trainingMode } } : {}),
      dataVersion: 1,
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(THURSDAY);
});
afterEach(() => vi.useRealTimers());

function renderCard() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <NextUpCard />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('Next Up card in rotation', () => {
  it('offers the next template whatever the weekday says', () => {
    // Push is scheduled today, but Pull is next in turn.
    seed({
      groups: [grp('A', 'Push', ['a'], [3]), grp('B', 'Pull', ['b']), C],
      workouts: [wo('2026-08-24', 'Push')],
      trainingMode: 'rotation',
    });
    renderCard();
    expect(screen.getByText('Pull')).toBeTruthy();
    expect(screen.getByText('NEXT IN ROTATION')).toBeTruthy();
    expect(screen.queryByText(/TODAY/)).toBeNull();
    expect(screen.getByText('Choose a different workout')).toBeTruthy();
  });

  it('starts it in one press', () => {
    seed({ groups: [A, B, C], workouts: [wo('2026-08-24', 'Push')], trainingMode: 'rotation' });
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /Pull/ }));
    expect(loadDraft()?.sourceGroupId).toBe('B');
  });

  it('still shows the missed session after a skipped day', () => {
    // Nothing trained for a week: the first template is still the one waiting.
    seed({ groups: [A, B, C], workouts: [], trainingMode: 'rotation' });
    renderCard();
    expect(screen.getByText('Push')).toBeTruthy();
  });

  it('keeps the done-today card, naming what is next', () => {
    seed({
      groups: [A, B, C],
      workouts: [wo('2026-08-27', 'Push')],
      trainingMode: 'rotation',
    });
    renderCard();
    expect(screen.getByText('DONE TODAY')).toBeTruthy();
    expect(screen.getByText('NEXT · Pull')).toBeTruthy();
  });

  it('leaves the week untouched without the setting', () => {
    seed({ groups: [grp('A', 'Push', ['a'], [3]), grp('B', 'Pull', ['b'], [1])] });
    renderCard();
    expect(screen.getByText(/TODAY · THU/)).toBeTruthy();
    expect(screen.queryByText('NEXT IN ROTATION')).toBeNull();
  });
});

describe('Start button in rotation', () => {
  function Where() {
    return <div data-testid="where">{useLocation().pathname}</div>;
  }

  it('opens the same template the card shows', () => {
    seed({ groups: [A, B, C], workouts: [wo('2026-08-24', 'Push')], trainingMode: 'rotation' });
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppProvider>
          <Routes>
            <Route path="*" element={<Where />} />
          </Routes>
          <BottomNav />
        </AppProvider>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Start workout/ }));
    expect(loadDraft()?.sourceGroupId).toBe('B');
    expect(screen.getByTestId('where').textContent).toBe('/workout/new');
  });
});

describe('How you train switch', () => {
  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/groups']}>
        <AppProvider>
          <Routes>
            <Route path="/groups" element={<GroupsPage />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>,
    );
  }
  const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');

  it('defaults to Fixed Week with its explanation and the weekdays', () => {
    seed({ groups: [grp('A', 'Push', ['a'], [0, 3]), B] });
    renderPage();
    const group = screen.getByRole('radiogroup', { name: 'How you train' });
    expect(within(group).getByRole('radio', { name: 'Fixed Week' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Each template has its own weekdays.')).toBeTruthy();
    expect(screen.getByText('MON · THU')).toBeTruthy();
  });

  it('switches to Rotation, saves it, and swaps the days for positions', () => {
    seed({
      groups: [grp('A', 'Push', ['a'], [0, 3]), B, C],
      workouts: [wo('2026-08-20', 'Push')],
    });
    renderPage();
    fireEvent.click(screen.getByRole('radio', { name: 'Rotation' }));

    expect(screen.getByRole('radio', { name: 'Rotation' }).getAttribute('aria-checked')).toBe('true');
    expect(
      screen.getByText('Templates take turns in the order below; Next Up is whichever is next.'),
    ).toBeTruthy();
    expect(screen.queryByText('MON · THU')).toBeNull();
    expect(screen.getByText('01')).toBeTruthy();
    expect(screen.getByText('02 · NEXT')).toBeTruthy();
    expect(screen.getByText('03')).toBeTruthy();
    expect(stored().preferences.trainingMode).toBe('rotation');
    // Kept for when the owner switches back.
    expect(stored().groups[0].days).toEqual([0, 3]);
  });

  it('switches back and the weekdays return', () => {
    seed({ groups: [grp('A', 'Push', ['a'], [0, 3]), B], trainingMode: 'rotation' });
    renderPage();
    fireEvent.click(screen.getByRole('radio', { name: 'Fixed Week' }));
    expect(screen.getByText('MON · THU')).toBeTruthy();
    expect(stored().preferences.trainingMode).toBe('week');
    // Other preferences survive the change.
    expect(stored().preferences.weightUnit).toBe('kg');
  });
});
