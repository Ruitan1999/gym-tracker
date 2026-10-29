import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BodyMap from '../components/workout/BodyMap';
import { PART_SLUGS, partOfSlug } from '../components/workout/bodyFigureShapes';
import { BODY_VIEWS } from '../data/bodyPaths';
import { workedBodyParts } from '../utils/bodyParts';
import type { BodyPart, Exercise, WorkoutEntry } from '../types';

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

  it('draws real outlines and lights only the worked part', () => {
    const { container } = render(<BodyMap worked={{ chest: 3 }} />);
    const paths = [...container.querySelectorAll('path[data-slug]')];
    expect(paths.length).toBeGreaterThan(20);
    for (const path of paths) expect((path.getAttribute('d') ?? '').length).toBeGreaterThan(20);
    const lit = paths.filter((p) => p.getAttribute('fill') === 'var(--color-volt)');
    expect(lit.map((p) => p.getAttribute('data-slug'))).toEqual(['chest']);
  });
});

describe('body part to outline mapping', () => {
  const allSlugs = new Set([
    ...Object.keys(BODY_VIEWS.front.paths),
    ...Object.keys(BODY_VIEWS.back.paths),
  ]);

  it('gives every body part except cardio at least one outline', () => {
    for (const [part, slugs] of Object.entries(PART_SLUGS)) {
      if (part === 'cardio') expect(slugs).toEqual([]);
      else expect(slugs.length, part).toBeGreaterThan(0);
    }
  });

  it('only names outlines that exist in the data, and never shares one', () => {
    const seen = new Set<string>();
    for (const slugs of Object.values(PART_SLUGS)) {
      for (const slug of slugs) {
        expect(allSlugs.has(slug), slug).toBe(true);
        expect(seen.has(slug), `${slug} used twice`).toBe(false);
        seen.add(slug);
      }
    }
  });

  it('leaves head, hands, feet and joints as the unlit base', () => {
    for (const slug of ['head', 'hair', 'hands', 'feet', 'knees', 'ankles']) {
      expect(partOfSlug(slug)).toBeUndefined();
    }
  });

  it('lights Legs on quads, hamstrings and glutes, and Chest on chest only', () => {
    const lit = (worked: Partial<Record<BodyPart, number>>) => {
      const { container, unmount } = render(<BodyMap worked={worked} />);
      const slugs = [...container.querySelectorAll('path[fill="var(--color-volt)"]')].map((p) =>
        p.getAttribute('data-slug'),
      );
      unmount();
      return slugs;
    };
    expect(lit({ legs: 2 })).toEqual(
      expect.arrayContaining(['quadriceps', 'hamstring', 'gluteal']),
    );
    expect(lit({ chest: 2 })).toEqual(['chest']);
  });
});
