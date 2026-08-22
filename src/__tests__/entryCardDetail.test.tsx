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

describe('An expanded exercise card', () => {
  beforeEach(() => localStorage.clear());

  it('shows the muscle group and the exercise image', () => {
    seedLibrary();
    const { container } = renderCard('ex-gv-0001', false);

    expect(screen.getByText('MUSCLE GROUP')).toBeDefined();
    expect(screen.getByText('CORE')).toBeDefined();
    const img = container.querySelector('img[src*="exercise-images"]');
    expect(img?.getAttribute('src')).toBe('/exercise-images/ex-gv-0001.jpg');
  });

  it('keeps all of that out of the way while folded', () => {
    seedLibrary();
    const { container } = renderCard('ex-gv-0001', true);

    expect(screen.queryByText('MUSCLE GROUP')).toBeNull();
    expect(container.querySelector('img[src*="exercise-images"]')).toBeNull();
  });

  it('still names the muscle group for an exercise with no image', () => {
    seedLibrary();
    const { container } = renderCard('custom-1', false);

    expect(screen.getByText('SHOULDERS')).toBeDefined();
    expect(container.querySelector('img[src*="exercise-images"]')).toBeNull();
  });

  it('credits the images wherever one is shown', () => {
    seedLibrary();
    renderCard('ex-gv-0001', false);
    expect(screen.getByText(/Gym visual/i)).toBeDefined();
  });

  it('does not credit anything when there is no image', () => {
    seedLibrary();
    renderCard('custom-1', false);
    expect(screen.queryByText(/Gym visual/i)).toBeNull();
  });
});
