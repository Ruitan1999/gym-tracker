import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import MiniBodyMap from '../components/workout/MiniBodyMap';
import NextUpCard from '../components/workout/NextUpCard';
import WorkoutForm from '../components/workout/WorkoutForm';
import GroupsPage from '../pages/GroupsPage';
import { bodyPartsOfTemplate } from '../utils/bodyParts';
import type { Exercise } from '../types';

const exercises: Exercise[] = [
  { id: 'a', name: 'Bench Press', bodyPart: 'chest', isCustom: true },
  { id: 'b', name: 'Barbell Row', bodyPart: 'back', isCustom: true },
  { id: 'c', name: 'Squat', bodyPart: 'legs', isCustom: true },
  { id: 'd', name: 'Run', bodyPart: 'cardio', isCustom: true },
  { id: 'e', name: 'Incline Press', bodyPart: 'chest', isCustom: true },
  // Stored before body parts existed.
  { id: 'f', name: 'My Thing', isCustom: true } as Exercise,
];

describe('bodyPartsOfTemplate', () => {
  it('lists each worked part once, head to toe', () => {
    expect(bodyPartsOfTemplate(['c', 'a', 'e', 'b'], exercises)).toEqual(['chest', 'back', 'legs']);
  });

  it('ignores unknown ids and exercises with no body part', () => {
    expect(bodyPartsOfTemplate(['gone', 'f', 'b'], exercises)).toEqual(['back']);
  });

  it('never lights a region for cardio', () => {
    expect(bodyPartsOfTemplate(['d'], exercises)).toEqual([]);
    expect(bodyPartsOfTemplate(['d', 'a'], exercises)).toEqual(['chest']);
  });

  it('is empty for an empty template', () => {
    expect(bodyPartsOfTemplate([], exercises)).toEqual([]);
  });
});

describe('MiniBodyMap', () => {
  it('renders nothing when there is nothing to light', () => {
    const { container } = render(<MiniBodyMap parts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('lights the worked regions and leaves the rest dim, front and back', () => {
    const { container } = render(<MiniBodyMap parts={['chest']} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(2);
    const lit = (svg: Element) =>
      svg.querySelectorAll('path[fill="var(--color-volt)"]').length;
    const dim = (svg: Element) =>
      svg.querySelectorAll('path[fill="var(--color-line-3)"]').length;
    // Chest is on the front only; the back view has nothing lit.
    expect(lit(svgs[0])).toBe(1);
    expect(lit(svgs[1])).toBe(0);
    expect(dim(svgs[0])).toBeGreaterThan(0);
    expect(dim(svgs[1])).toBeGreaterThan(0);
  });

  it('lights both sides for a part drawn on both', () => {
    const { container } = render(<MiniBodyMap parts={['legs']} />);
    const svgs = container.querySelectorAll('svg');
    const litSlugs = (svg: Element) =>
      [...svg.querySelectorAll('path[fill="var(--color-volt)"]')].map((n) => n.getAttribute('data-slug'));
    // Legs light quads, adductors and hip flexors in front; glutes, hamstrings
    // and adductors behind.
    expect(litSlugs(svgs[0])).toEqual(expect.arrayContaining(['quadriceps', 'adductors']));
    expect(litSlugs(svgs[1])).toEqual(expect.arrayContaining(['gluteal', 'hamstring']));
    expect(litSlugs(svgs[0])).not.toContain('calves');
  });

  it('is about 36px high, hidden from assistive tech, with a text alternative', () => {
    const { container } = render(<MiniBodyMap parts={['chest', 'shoulders']} />);
    for (const svg of container.querySelectorAll('svg')) {
      expect(svg.getAttribute('height')).toBe('36');
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    }
    expect(screen.getByRole('img', { name: 'Works chest, shoulders' })).toBeTruthy();
  });
});

const STORAGE_KEY = 'gym-tracker-data';
const DRAFT_KEY = 'liftgauge.workoutDraft.v1';
// A Thursday, index 3.
const THURSDAY = new Date('2026-08-27T09:00:00');

function seed() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      exercises,
      workouts: [],
      groups: [
        { id: 'push', name: 'Push Day', exerciseIds: ['a'], createdAt: '2026-01-01T00:00:00Z', days: [3] },
        { id: 'legs', name: 'Leg Day', exerciseIds: ['c', 'd'], createdAt: '2026-01-01T00:00:00Z' },
        { id: 'cardio', name: 'Cardio Only', exerciseIds: ['d'], createdAt: '2026-01-01T00:00:00Z' },
      ],
      dataVersion: 1,
    }),
  );
}

describe('where the mini map is placed', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(THURSDAY);
    seed();
  });
  afterEach(() => vi.useRealTimers());

  it('is left off the Next Up row, where the name already says it', () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <NextUpCard />
        </AppProvider>
      </MemoryRouter>,
    );
    expect(screen.queryByRole('img', { name: /^Works / })).toBeNull();
  });

  it('sits on each Manage templates row', () => {
    render(
      <MemoryRouter initialEntries={['/groups']}>
        <AppProvider>
          <Routes>
            <Route path="/groups" element={<GroupsPage />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('img', { name: 'Works chest' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Works legs' })).toBeTruthy();
  });

  it('shows in the active session header, lit by the exercises so far', () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        date: '2026-08-27',
        startedAt: '2026-08-27T08:55:00.000Z',
        entries: [
          { id: 'e1', exerciseId: 'b', sets: [{ setNumber: 1, reps: 0, weightKg: 0 }] },
        ],
        notes: '',
        collapsedIds: [],
      }),
    );
    render(
      <MemoryRouter initialEntries={['/workout/new']}>
        <AppProvider>
          <WorkoutForm name="" onNameChange={() => {}} />
        </AppProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('img', { name: 'Works back' })).toBeTruthy();
  });

  it('is hidden in the session header when there are no exercises yet', () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        date: '2026-08-27',
        startedAt: '2026-08-27T08:55:00.000Z',
        entries: [],
        notes: '',
        collapsedIds: [],
      }),
    );
    render(
      <MemoryRouter initialEntries={['/workout/new']}>
        <AppProvider>
          <WorkoutForm name="" onNameChange={() => {}} />
        </AppProvider>
      </MemoryRouter>,
    );
    expect(screen.queryByRole('img', { name: /^Works / })).toBeNull();
  });
});
