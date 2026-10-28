import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import EntryCard from '../components/workout/EntryCard';
import type { WorkoutSet } from '../types';

const NOW: WorkoutSet[] = [
  { setNumber: 1, reps: 0, weightKg: 0 },
  { setNumber: 2, reps: 0, weightKg: 0 },
];
const HIT: WorkoutSet[] = [
  { setNumber: 1, reps: 10, weightKg: 80 },
  { setNumber: 2, reps: 10, weightKg: 80 },
];
const MISSED: WorkoutSet[] = [
  { setNumber: 1, reps: 10, weightKg: 80 },
  { setNumber: 2, reps: 10, weightKg: 80 },
  { setNumber: 3, reps: 7, weightKg: 80 },
];

function renderCard(previousSets?: WorkoutSet[], collapsed = false, done = false) {
  localStorage.setItem(
    'gym-tracker-data',
    JSON.stringify({
      exercises: [{ id: 'a', name: 'Bench Press', bodyPart: 'chest', isCustom: true }],
      workouts: [],
      groups: [],
      dataVersion: 1,
    }),
  );
  const onSetsChange = vi.fn();
  render(
    <AppProvider>
      <EntryCard
        exerciseId="a"
        sets={NOW}
        previousSets={previousSets}
        onSetsChange={onSetsChange}
        onRemove={vi.fn()}
        collapsed={collapsed}
        done={done}
      />
    </AppProvider>,
  );
  return { onSetsChange };
}

describe('target advice line on the entry card', () => {
  beforeEach(() => localStorage.clear());

  it('shows the step-up sentence when every rep was hit', () => {
    renderCard(HIT);
    expect(screen.getByTestId('target-advice').textContent).toBe(
      'You hit every rep last time. Try 82.5 kg (+2.5).',
    );
  });

  it('shows the same-weight sentence when reps dropped', () => {
    renderCard(MISSED);
    expect(screen.getByTestId('target-advice').textContent).toBe(
      'Reps dropped on set 3 last time. Same weight again.',
    );
  });

  it('is absent without previous data', () => {
    renderCard(undefined);
    expect(screen.queryByTestId('target-advice')).toBeNull();
  });

  it('is absent on a collapsed card', () => {
    renderCard(HIT, true);
    expect(screen.queryByTestId('target-advice')).toBeNull();
  });

  it('is absent once marked done', () => {
    localStorage.clear();
    renderCard(HIT, false, true);
    expect(screen.queryByTestId('target-advice')).toBeNull();
  });

  it('is not a button and changes nothing when tapped', () => {
    const { onSetsChange } = renderCard(HIT);
    const line = screen.getByTestId('target-advice');
    expect(line.closest('button')).toBeNull();
    fireEvent.click(line);
    fireEvent.pointerDown(line);
    fireEvent.pointerUp(line);
    expect(onSetsChange).not.toHaveBeenCalled();
  });
});
