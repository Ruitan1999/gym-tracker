import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import EntryCard from '../components/workout/EntryCard';

const STORAGE_KEY = 'gym-tracker-data';

function seedLibrary() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      exercises: [
        { id: 'ex-gv-0001', name: 'Sit-Up', bodyPart: 'core', isCustom: false },
        { id: 'custom-1', name: 'My Own', bodyPart: 'shoulders', isCustom: true },
      ],
      workouts: [],
      groups: [],
      dataVersion: 1,
    }),
  );
}

function renderCard(exerciseId: string, collapsed: boolean) {
  return render(
    <AppProvider>
      <EntryCard
        index={0}
        exerciseId={exerciseId}
        sets={[{ setNumber: 1, reps: 8, weightKg: 60 }]}
        onSetsChange={() => {}}
        onRemove={() => {}}
        collapsed={collapsed}
        onToggleCollapsed={() => {}}
        done={false}
        onToggleDone={() => {}}
      />
    </AppProvider>,
  );
}

const image = (c: HTMLElement) => c.querySelector('img[src*="exercise-images"]');

describe('An expanded exercise card', () => {
  beforeEach(() => localStorage.clear());

  it('shows the muscle group and the exercise image in its header', () => {
    seedLibrary();
    const { container } = renderCard('ex-gv-0001', false);

    expect(screen.getByText('CORE')).toBeDefined();
    expect(image(container)?.getAttribute('src')).toBe('/exercise-images/ex-gv-0001.jpg');
  });

  it('keeps both out of the way while folded', () => {
    seedLibrary();
    const { container } = renderCard('ex-gv-0001', true);

    expect(screen.queryByText('CORE')).toBeNull();
    expect(image(container)).toBeNull();
  });

  it('still names the muscle group for an exercise with no image', () => {
    seedLibrary();
    const { container } = renderCard('custom-1', false);

    expect(screen.getByText('SHOULDERS')).toBeDefined();
    expect(image(container)).toBeNull();
  });

  it('leaves the folded summary line alone', () => {
    seedLibrary();
    renderCard('ex-gv-0001', true);
    // Folded, the row still reports the sets rather than the muscle group.
    expect(screen.getByText(/1×8/)).toBeDefined();
  });
});
