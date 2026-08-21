import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BodyMap from '../components/workout/BodyMap';
import { workedBodyParts } from '../utils/bodyParts';
import type { Exercise, WorkoutEntry } from '../types';

const exercises: Exercise[] = [
  { id: 'a', name: 'Bench Press', bodyPart: 'chest', isCustom: false },
  { id: 'b', name: 'Curl', bodyPart: 'arms', isCustom: false },
  { id: 'c', name: 'Dip', bodyPart: 'chest', isCustom: false },
  // Stored before body parts existed. The type says this can't happen; data
  // written by an older version says otherwise.
  { id: 'd', name: 'My Thing', isCustom: true } as Exercise,
];

function entry(exerciseId: string, reps: number[]): WorkoutEntry {
  return {
    id: `e-${exerciseId}`,
    exerciseId,
    sets: reps.map((r, i) => ({ setNumber: i + 1, reps: r, weightKg: 40 })),
  };
}

describe('workedBodyParts', () => {
  it('adds up sets per body part across exercises', () => {
    const worked = workedBodyParts(
      { entries: [entry('a', [8, 8, 8]), entry('c', [10, 10]), entry('b', [12])] },
      exercises,
    );
    expect(worked).toEqual({ chest: 5, arms: 1 });
  });

  it('ignores sets that were never actually done', () => {
    // Set up and abandoned: shading the map for these would claim work that
    // did not happen.
    const worked = workedBodyParts({ entries: [entry('a', [8, 0, 0])] }, exercises);
    expect(worked).toEqual({ chest: 1 });
  });

  it('leaves out an exercise with nothing logged at all', () => {
    expect(workedBodyParts({ entries: [entry('a', [0, 0])] }, exercises)).toEqual({});
  });

  it('skips exercises that carry no body part', () => {
    const worked = workedBodyParts({ entries: [entry('d', [8]), entry('a', [8])] }, exercises);
    expect(worked).toEqual({ chest: 1 });
  });

  it('skips an exercise that is no longer in the library', () => {
    expect(workedBodyParts({ entries: [entry('gone', [8])] }, exercises)).toEqual({});
  });
});

describe('BodyMap', () => {
  it('renders nothing when no body part was worked', () => {
    const { container } = render(<BodyMap worked={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('lists worked parts hardest first, with set counts', () => {
    render(<BodyMap worked={{ chest: 5, arms: 7, core: 2 }} />);

    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items[0]).toContain('ARMS');
    expect(items[0]).toContain('7');
    expect(items[1]).toContain('CHEST');
    expect(items[2]).toContain('CORE');
  });

  it('says SET rather than SETS for a single set', () => {
    render(<BodyMap worked={{ chest: 1 }} />);
    expect(screen.getByRole('listitem').textContent).toContain('1SET');
  });

  it('draws both views', () => {
    render(<BodyMap worked={{ chest: 3 }} />);
    expect(screen.getByRole('img', { name: 'FRONT view' })).toBeDefined();
    expect(screen.getByRole('img', { name: 'BACK view' })).toBeDefined();
  });

  it('gives every drawn region a real size', () => {
    // <rect> takes width/height; shorthand attributes are silently ignored and
    // the whole figure collapses to nothing visible.
    const { container } = render(<BodyMap worked={{ chest: 3 }} />);
    const rects = [...container.querySelectorAll('rect')];
    expect(rects.length).toBeGreaterThan(0);
    for (const rect of rects) {
      expect(Number(rect.getAttribute('width'))).toBeGreaterThan(0);
      expect(Number(rect.getAttribute('height'))).toBeGreaterThan(0);
    }
  });
});
