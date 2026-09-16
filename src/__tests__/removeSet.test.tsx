import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, act } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import EntryCard from '../components/workout/EntryCard';
import type { WorkoutSet } from '../types';

const STORAGE_KEY = 'gym-tracker-data';

/** Four sets a person could tell apart at a glance. */
const FOUR: WorkoutSet[] = [
  { setNumber: 1, reps: 10, weightKg: 20 },
  { setNumber: 2, reps: 8, weightKg: 40 },
  { setNumber: 3, reps: 6, weightKg: 60 },
  { setNumber: 4, reps: 4, weightKg: 80 },
];

function seed() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      exercises: [{ id: 'a', name: 'Bench Press', bodyPart: 'chest', isCustom: true }],
      workouts: [],
      groups: [],
      dataVersion: 1,
    }),
  );
}

/**
 * The way the form actually uses it: the card is told what the sets are now, so
 * every change it asks for comes straight back down as a new array.
 */
function StatefulCard({ initial, onChange }: { initial: WorkoutSet[]; onChange: (s: WorkoutSet[]) => void }) {
  const [sets, setSets] = useState(initial);
  return (
    <EntryCard
      exerciseId="a"
      sets={sets}
      onSetsChange={(next) => {
        setSets(next);
        onChange(next);
      }}
      onRemove={vi.fn()}
    />
  );
}

function renderCard(initial: WorkoutSet[] = FOUR) {
  seed();
  const changes: WorkoutSet[][] = [];
  render(
    <AppProvider>
      <StatefulCard initial={initial} onChange={(s) => changes.push(s)} />
    </AppProvider>,
  );
  return {
    changes,
    /** Each row's weight is unique in the fixture, so it names the row. */
    weights: () => changes[changes.length - 1]?.map((s) => s.weightKg) ?? initial.map((s) => s.weightKg),
    numbers: () => changes[changes.length - 1]?.map((s) => s.setNumber) ?? [],
    remove: async (n: number) => {
      act(() => {
        screen.getByRole('button', { name: `Remove set ${n}` }).click();
      });
      // The row waits out its exit animation before the change is handed up.
      await act(async () => {
        vi.advanceTimersByTime(400);
        await Promise.resolve();
      });
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

describe('removing a set', () => {
  it('drops the one that was tapped, not the last one', async () => {
    const card = renderCard();
    await card.remove(2);

    expect(card.weights()).toEqual([20, 60, 80]);
    // Renumbered, so the badges still read 1, 2, 3.
    expect(card.numbers()).toEqual([1, 2, 3]);
  });

  it('drops the first when the first is tapped', async () => {
    const card = renderCard();
    await card.remove(1);
    expect(card.weights()).toEqual([40, 60, 80]);
  });

  it('drops the last when the last is tapped', async () => {
    const card = renderCard();
    await card.remove(4);
    expect(card.weights()).toEqual([20, 40, 60]);
  });

  it('keeps naming the right row over repeated removals', async () => {
    const card = renderCard();

    // Take the second row out, then the second row of what's left.
    await card.remove(2);
    expect(card.weights()).toEqual([20, 60, 80]);
    await card.remove(2);
    expect(card.weights()).toEqual([20, 80]);
  });

  it('removes the tapped row after one has been added', async () => {
    const card = renderCard();

    act(() => {
      screen.getByRole('button', { name: /ADD SET/i }).click();
    });
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });
    expect(card.weights()).toEqual([20, 40, 60, 80, 80]);

    await card.remove(2);
    expect(card.weights()).toEqual([20, 60, 80, 80]);
  });

  /**
   * The removal lands after the row's exit animation, so anything the owner does
   * in that window has to be accounted for — this is where an index resolved
   * against one list used to be applied to another.
   */
  describe('when the sets change while the row is still animating out', () => {
    it('still takes the tapped row when a set is added mid-exit', async () => {
      const card = renderCard();

      act(() => {
        screen.getByRole('button', { name: 'Remove set 2' }).click();
      });
      // Part-way through the 300ms exit, before the removal commits.
      act(() => {
        vi.advanceTimersByTime(120);
      });
      act(() => {
        screen.getByRole('button', { name: /ADD SET/i }).click();
      });
      await act(async () => {
        vi.advanceTimersByTime(600);
        await Promise.resolve();
      });

      // The 40 is gone because that is what was tapped, and the set added in
      // the meantime is still there.
      expect(card.weights()).toEqual([20, 60, 80, 80]);
      expect(card.numbers()).toEqual([1, 2, 3, 4]);
    });

    it('keeps a weight entered mid-exit', async () => {
      const card = renderCard();

      act(() => {
        screen.getByRole('button', { name: 'Remove set 4' }).click();
      });
      act(() => {
        vi.advanceTimersByTime(120);
      });
      // A weight committed on the first row while the last one animates out.
      act(() => {
        screen.getAllByRole('button', { name: /increase weight/i })[0]?.click();
      });
      await act(async () => {
        vi.advanceTimersByTime(600);
        await Promise.resolve();
      });

      const weights = card.weights();
      expect(weights).toHaveLength(3);
      // The tapped row went, and the edit survived rather than being rolled back.
      expect(weights[0]).toBeGreaterThan(20);
      expect(weights.slice(1)).toEqual([40, 60]);
    });
  });
});
