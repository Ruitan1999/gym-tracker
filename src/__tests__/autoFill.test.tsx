import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import LogWorkoutPage from '../pages/LogWorkoutPage';
import SettingsPage from '../pages/SettingsPage';
import { loadAppData } from '../utils/storage';
import { beginTemplate, prepareStart } from '../utils/startSession';
import {
  confirmEntry,
  confirmSet,
  draftFromTemplate,
  draftHasProgress,
  loadDraft,
  shiftAfterRemoval,
  unconfirmedOf,
  type Draft,
} from '../utils/templateSession';
import { sessionProgress } from '../utils/sessionProgress';
import type { Workout, WorkoutGroup, WorkoutSet } from '../types';

const STORAGE_KEY = 'gym-tracker-data';
const DRAFT_KEY = 'liftgauge.workoutDraft.v1';

const BENCH = 'ex-push-001';
const ROW = 'ex-pull-006';

const group: WorkoutGroup = {
  id: 'g1',
  name: 'Push Day A',
  exerciseIds: [BENCH],
  createdAt: '2026-07-01T10:00:00.000Z',
};

function sets(...rows: Array<[number, number]>): WorkoutSet[] {
  return rows.map(([reps, weightKg], i) => ({ setNumber: i + 1, reps, weightKg }));
}

function past(exerciseId: string, s: WorkoutSet[], createdAt = '2026-08-01T10:00:00.000Z'): Workout {
  return {
    id: `w-${exerciseId}-${createdAt}`,
    date: createdAt.slice(0, 10),
    entries: [{ id: `e-${exerciseId}`, exerciseId, sets: s }],
    createdAt,
  };
}

const DISTINCT = sets([10, 20], [8, 40], [6, 60], [4, 80]);
const IDENTICAL = sets([8, 50], [8, 50], [8, 50]);

function seed(workouts: Workout[], preferences: Record<string, unknown> = {}) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ workouts, groups: [group], preferences, dataVersion: 1 }),
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

/** Starts the template the way the Start button does, then opens the form on it. */
function startTemplate(autoFill: boolean) {
  const { workouts } = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(beginTemplate(group, workouts, { autoFill })).toBe('ready');
  renderSession();
  // Templates open folded.
  fireEvent.click(screen.getByRole('button', { name: 'Expand exercise' }));
}

/** Every row's [reps, kg] as the card shows it, with a dash read as 0. */
function rows(): Array<[number, number]> {
  return [...document.querySelectorAll('[data-set-row]')].map((row) => {
    const m = /REPS(\d+|—)LOAD KG(\d+(?:\.\d+)?|—)/.exec(row.textContent ?? '');
    const n = (v: string) => (v === '—' ? 0 : Number(v));
    return [n(m![1]), n(m![2])];
  });
}

const numberBadges = () =>
  [...document.querySelectorAll('[data-set-row]')].map(
    (r) => /^(\d\d)SET/.exec(r.textContent ?? '')?.[1],
  );

const strip = () => within(screen.getByTestId('session-strip'));

async function removeRow(n: number) {
  act(() => {
    const button = screen.getByRole('button', { name: `Remove set ${n}` });
    fireEvent.pointerDown(button, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(button, { pointerId: 1, clientX: 100, clientY: 100 });
  });
  await act(async () => {
    vi.advanceTimersByTime(400);
    await Promise.resolve();
  });
}

const savedDraft = () => JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') as Draft | null;
function pickBench() {
  fireEvent.change(screen.getByPlaceholderText('SEARCH TYPE TO FILTER'), {
    target: { value: 'Bench Press' },
  });
  fireEvent.click(screen.getAllByText('Bench Press')[0]);
}
const stepUp = () => screen.getAllByRole('button', { name: 'Increase weight by 2.5 kg' });

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('starting a template', () => {
  it('fills reps and weight from last time when auto-fill is on', () => {
    const d = draftFromTemplate(group, [past(BENCH, DISTINCT)], { autoFill: true });
    expect(d.entries[0].sets).toEqual(DISTINCT);
  });

  it('leaves zeros when it is off, exactly as before', () => {
    const d = draftFromTemplate(group, [past(BENCH, DISTINCT)]);
    expect(d.entries[0].sets).toEqual(sets([0, 0], [0, 0], [0, 0], [0, 0]));
    expect(d.unconfirmed).toBeUndefined();
    const off = draftFromTemplate(group, [past(BENCH, DISTINCT)], { autoFill: false });
    expect(off.entries[0].sets).toEqual(d.entries[0].sets);
  });

  it('takes the most recent session, not the first one found', () => {
    const older = past(BENCH, sets([5, 10]), '2026-07-01T10:00:00.000Z');
    const newer = past(BENCH, sets([6, 12], [6, 12]), '2026-08-01T10:00:00.000Z');
    const d = draftFromTemplate(group, [older, newer], { autoFill: true });
    expect(d.entries[0].sets).toEqual(sets([6, 12], [6, 12]));
  });

  it('keeps a single empty set when there is no history', () => {
    const d = draftFromTemplate(group, [], { autoFill: true });
    expect(d.entries[0].sets).toEqual(sets([0, 0]));
    expect(d.unconfirmed).toBeUndefined();
  });

  it('threads through beginTemplate and prepareStart', () => {
    const workouts = [past(BENCH, DISTINCT)];
    beginTemplate(group, workouts, { autoFill: true });
    expect(loadDraft()?.entries[0].sets).toEqual(DISTINCT);

    localStorage.clear();
    prepareStart(group, workouts, { autoFill: true });
    expect(loadDraft()?.entries[0].sets).toEqual(DISTINCT);

    localStorage.clear();
    prepareStart(group, workouts);
    expect(loadDraft()?.entries[0].sets).toEqual(sets([0, 0], [0, 0], [0, 0], [0, 0]));
  });

  it('opens the form on the filled-in sets and still shows what last time was', () => {
    seed([past(BENCH, DISTINCT)], { autoFillFromLast: true });
    startTemplate(true);
    expect(rows()).toEqual([[10, 20], [8, 40], [6, 60], [4, 80]]);
    expect(screen.getAllByText('10 × 20 KG').length).toBeGreaterThan(0);
    expect(screen.getByTestId('target-advice')).toBeTruthy();
  });

  it('opens on blanks when it is off', () => {
    seed([past(BENCH, DISTINCT)]);
    startTemplate(false);
    expect(rows()).toEqual([[0, 0], [0, 0], [0, 0], [0, 0]]);
    expect(screen.getAllByText('10 × 20 KG').length).toBeGreaterThan(0);
  });
});

describe('an exercise added during a session', () => {
  function seedWithOpenSession(preferences: Record<string, unknown>) {
    seed([past(BENCH, DISTINCT)], preferences);
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        date: '2026-08-10',
        entries: [{ id: 'row-e', exerciseId: ROW, sets: sets([5, 30]) }],
        notes: '',
        collapsedIds: [],
      }),
    );
  }

  it('is filled from last time with auto-fill on', () => {
    seedWithOpenSession({ autoFillFromLast: true });
    renderSession();
    fireEvent.click(screen.getByRole('button', { name: /Add Exercise/ }));
    pickBench();
    expect(rows().slice(-4)).toEqual([[10, 20], [8, 40], [6, 60], [4, 80]]);
    // Not counted as done until touched: only the seeded row's set is.
    expect(strip().getByText(/1\/5 sets/)).toBeTruthy();
  });

  it('starts blank with auto-fill off', () => {
    seedWithOpenSession({});
    renderSession();
    fireEvent.click(screen.getByRole('button', { name: /Add Exercise/ }));
    pickBench();
    expect(rows().slice(-4)).toEqual([[0, 0], [0, 0], [0, 0], [0, 0]]);
  });

  it('is a single blank set when the exercise has no history', () => {
    seed([], { autoFillFromLast: true });
    renderSession();
    fireEvent.click(screen.getByRole('button', { name: /Add Exercise/ }));
    pickBench();
    expect(rows()).toEqual([[0, 0]]);
  });
});

describe('removing a set with auto-fill on', () => {
  it.each([1, 2, 3, 4])('takes out exactly set %i of distinct sets', async (n) => {
    seed([past(BENCH, DISTINCT)], { autoFillFromLast: true });
    startTemplate(true);

    await removeRow(n);

    expect(rows()).toEqual(DISTINCT.filter((_, i) => i !== n - 1).map((s) => [s.reps, s.weightKg]));
    expect(numberBadges()).toEqual(['01', '02', '03']);
  });

  it('keeps naming the right row over repeated removals', async () => {
    seed([past(BENCH, DISTINCT)], { autoFillFromLast: true });
    startTemplate(true);

    await removeRow(2);
    expect(rows()).toEqual([[10, 20], [6, 60], [4, 80]]);
    await removeRow(2);
    expect(rows()).toEqual([[10, 20], [4, 80]]);
    expect(numberBadges()).toEqual(['01', '02']);
  });

  it.each([1, 2, 3])('takes out one of identical sets, set %i, and renumbers', async (n) => {
    seed([past(BENCH, IDENTICAL)], { autoFillFromLast: true });
    startTemplate(true);

    await removeRow(n);

    expect(rows()).toEqual([[8, 50], [8, 50]]);
    expect(numberBadges()).toEqual(['01', '02']);
  });

  it('carries the untouched state with the row it belongs to', async () => {
    seed([past(BENCH, DISTINCT)], { autoFillFromLast: true });
    startTemplate(true);

    // Touch set 3 only.
    fireEvent.click(stepUp()[2]);
    expect(strip().getByText(/1\/4 sets/)).toBeTruthy();

    await removeRow(1);

    expect(rows()).toEqual([[8, 40], [6, 62.5], [4, 80]]);
    // The touched set is still the one that counts.
    expect(strip().getByText(/1\/3 sets/)).toBeTruthy();
    expect(savedDraft()?.unconfirmed).toEqual({ [savedDraft()!.entries[0].id]: [0, 2] });
  });

  it('removing the touched set leaves the rest untouched', async () => {
    seed([past(BENCH, IDENTICAL)], { autoFillFromLast: true });
    startTemplate(true);

    fireEvent.click(stepUp()[1]);
    await removeRow(2);

    expect(rows()).toEqual([[8, 50], [8, 50]]);
    expect(strip().getByText(/0\/2 sets/)).toBeTruthy();
    expect(savedDraft()).toBeNull();
  });
});

describe('the rest timer', () => {
  it('starts on the first touch of a filled-in set, even to the same value', () => {
    seed([past(BENCH, DISTINCT)], { autoFillFromLast: true });
    startTemplate(true);
    expect(screen.queryByTestId('rest-timer')).toBeNull();

    // "Tap to use" writes the very numbers already there.
    fireEvent.click(screen.getAllByText('TAP TO USE →')[0]);

    expect(rows()[0]).toEqual([10, 20]);
    expect(screen.getByTestId('rest-timer')).toBeTruthy();
  });

  it('starts on a weight change too', () => {
    seed([past(BENCH, DISTINCT)], { autoFillFromLast: true });
    startTemplate(true);
    fireEvent.click(stepUp()[0]);
    expect(screen.getByTestId('rest-timer')).toBeTruthy();
  });

  it('does not start again when the same set is touched twice', () => {
    seed([past(BENCH, DISTINCT)], { autoFillFromLast: true });
    startTemplate(true);
    fireEvent.click(stepUp()[0]);
    fireEvent.click(screen.getByText('Skip'));
    expect(screen.queryByTestId('rest-timer')).toBeNull();

    fireEvent.click(stepUp()[0]);
    expect(screen.queryByTestId('rest-timer')).toBeNull();
  });

  it('starts on reps going from nothing to something, as before, with auto-fill off', () => {
    seed([past(BENCH, DISTINCT)]);
    startTemplate(false);
    // A weight change alone is not a logged set.
    fireEvent.click(stepUp()[0]);
    expect(screen.queryByTestId('rest-timer')).toBeNull();

    fireEvent.click(screen.getAllByRole('button', { name: 'Set reps to 8' })[0]);
    expect(screen.getByTestId('rest-timer')).toBeTruthy();
  });
});

describe('what counts as work', () => {
  it('does not count an untouched filled-in draft as progress', () => {
    const d = draftFromTemplate(group, [past(BENCH, DISTINCT)], { autoFill: true });
    expect(draftHasProgress(d)).toBe(false);
    // Notes still do.
    expect(draftHasProgress({ ...d, notes: 'felt good' })).toBe(true);
  });

  it('counts it once a set is touched', () => {
    const d = draftFromTemplate(group, [past(BENCH, DISTINCT)], { autoFill: true });
    const id = d.entries[0].id;
    expect(draftHasProgress({ ...d, unconfirmed: confirmSet(d.unconfirmed!, id, 1) })).toBe(true);
  });

  it('is unchanged without auto-fill: real numbers are progress', () => {
    const d = draftFromTemplate(group, []);
    expect(draftHasProgress(d)).toBe(false);
    d.entries[0].sets[0].reps = 5;
    expect(draftHasProgress(d)).toBe(true);
  });

  it('does not write a draft for an untouched filled-in session, so Start does not say Resume', () => {
    seed([past(BENCH, DISTINCT)], { autoFillFromLast: true });
    startTemplate(true);
    expect(savedDraft()).toBeNull();
    expect(draftHasProgress(loadDraft())).toBe(false);
  });

  it('writes the draft once a set is touched, remembering which are still unconfirmed', () => {
    seed([past(BENCH, DISTINCT)], { autoFillFromLast: true });
    startTemplate(true);
    fireEvent.click(stepUp()[1]);

    const draft = savedDraft()!;
    expect(draft.unconfirmed).toEqual({ [draft.entries[0].id]: [0, 2, 3] });
    expect(draftHasProgress(draft)).toBe(true);
  });

  it('never puts the marker on the saved workout', () => {
    seed([past(BENCH, DISTINCT)], { autoFillFromLast: true });
    startTemplate(true);
    fireEvent.click(screen.getByRole('button', { name: 'Mark exercise complete' }));
    fireEvent.click(screen.getByRole('button', { name: /Save Session/ }));
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!).workouts as Workout[];
    expect(saved).toHaveLength(2);
    const mine = saved.find((w) => w.entries[0].id !== `e-${BENCH}`)!;
    expect(JSON.stringify(mine)).not.toContain('unconfirmed');
    expect(mine.entries[0].sets).toEqual(DISTINCT);
  });

  it('counts every set once the exercise is marked done', () => {
    seed([past(BENCH, DISTINCT)], { autoFillFromLast: true });
    startTemplate(true);
    expect(strip().getByText(/0\/4 sets/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mark exercise complete' }));
    expect(strip().getByText(/4\/4 sets/)).toBeTruthy();
  });
});

describe('the session strip count', () => {
  it('leaves out sets that are still last time’s numbers', () => {
    seed([past(BENCH, DISTINCT)], { autoFillFromLast: true });
    startTemplate(true);
    expect(strip().getByText(/0\/4 sets/)).toBeTruthy();
    fireEvent.click(screen.getAllByText('TAP TO USE →')[0]);
    expect(strip().getByText(/1\/4 sets/)).toBeTruthy();
  });

  it('sessionProgress skips unconfirmed sets in sets and volume, and is unchanged without them', () => {
    const entries = [{ id: 'a', exerciseId: BENCH, sets: sets([10, 20], [8, 40]) }];
    expect(sessionProgress(entries).setsDone).toBe(2);
    const p = sessionProgress(entries, { a: [1] });
    expect(p.setsDone).toBe(1);
    expect(p.volumeKg).toBe(200);
    expect(p.exercises[0].fraction).toBe(0.5);
  });
});

describe('unconfirmed bookkeeping', () => {
  const entries = [{ id: 'a', exerciseId: BENCH, sets: sets([5, 5], [0, 0], [5, 5]) }];

  it('marks only sets that arrived with numbers', () => {
    expect(unconfirmedOf(entries)).toEqual({ a: [0, 2] });
  });
  it('confirms one set, then the entry', () => {
    expect(confirmSet({ a: [0, 2] }, 'a', 0)).toEqual({ a: [2] });
    expect(confirmSet({ a: [2] }, 'a', 2)).toEqual({});
    expect(confirmEntry({ a: [0, 2], b: [1] }, 'a')).toEqual({ b: [1] });
  });
  it('shifts the rows below a removed one', () => {
    expect(shiftAfterRemoval({ a: [0, 1, 3] }, 'a', 1)).toEqual({ a: [0, 2] });
    expect(shiftAfterRemoval({ a: [1] }, 'a', 1)).toEqual({});
    expect(shiftAfterRemoval({ b: [1] }, 'a', 0)).toEqual({ b: [1] });
  });
});

describe('the setting', () => {
  function renderSettings() {
    return render(
      <MemoryRouter>
        <AppProvider>
          <SettingsPage />
        </AppProvider>
      </MemoryRouter>,
    );
  }

  it('is off by default and persists once switched on, and off again', () => {
    seed([]);
    renderSettings();
    const toggle = screen.getByRole('switch', { name: /FILL FROM LAST SESSION/ });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(screen.getByText(/You can still change\s+every set\./)).toBeTruthy();

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).preferences.autoFillFromLast).toBe(true);
    expect(loadAppData().preferences.autoFillFromLast).toBe(true);

    fireEvent.click(toggle);
    expect(loadAppData().preferences.autoFillFromLast).toBe(false);
  });

  it('is absent from preferences that never set it', () => {
    seed([]);
    expect(loadAppData().preferences.autoFillFromLast).toBeUndefined();
  });
});
