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

function renderCard(exerciseId: string, collapsed: boolean, done = false) {
  return render(
    <AppProvider>
      <EntryCard
        index={0}
        exerciseId={exerciseId}
        sets={[
          { setNumber: 1, reps: 8, weightKg: 60 },
          { setNumber: 2, reps: 8, weightKg: 60 },
        ]}
        onSetsChange={() => {}}
        onRemove={() => {}}
        collapsed={collapsed}
        onToggleCollapsed={() => {}}
        done={done}
        onToggleDone={() => {}}
      />
    </AppProvider>,
  );
}

const image = (c: HTMLElement) => c.querySelector('img[src*="exercise-images"]');

describe('An exercise card', () => {
  beforeEach(() => localStorage.clear());

  it('shows the image and muscle group while folded', () => {
    seedLibrary();
    const { container } = renderCard('ex-gv-0001', true);

    expect(screen.getByText('CORE')).toBeDefined();
    expect(image(container)?.getAttribute('src')).toBe('/assets/exercise-images/ex-gv-0001.jpg');
  });

  it('shows the same two when open', () => {
    seedLibrary();
    const { container } = renderCard('ex-gv-0001', false);

    expect(screen.getByText('CORE')).toBeDefined();
    expect(image(container)).toBeTruthy();
  });

  it('no longer reports sets or weight on the folded row', () => {
    seedLibrary();
    renderCard('ex-gv-0001', true);

    expect(screen.queryByText(/2×16/)).toBeNull();
    expect(screen.queryByText(/60KG/)).toBeNull();
  });

  it('says so on the folded row once the exercise is done, after the group', () => {
    seedLibrary();
    renderCard('ex-gv-0001', true, true);

    const done = screen.getByText('DONE');
    const group = screen.getByText('CORE');
    expect(done).toBeDefined();
    // DOCUMENT_POSITION_PRECEDING: the group comes first in the row.
    expect(done.compareDocumentPosition(group) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it('leaves that to the complete button when open', () => {
    seedLibrary();
    renderCard('ex-gv-0001', false, true);
    // Open, the card has a full-width button carrying the same state.
    expect(screen.queryByText('DONE')).toBeNull();
  });

  it('carries no complete toggle while folded', () => {
    seedLibrary();
    renderCard('ex-gv-0001', true);
    expect(screen.queryByRole('button', { name: /Mark exercise/ })).toBeNull();
  });

  it('still offers one when open, so a card can be un-marked', () => {
    seedLibrary();
    renderCard('ex-gv-0001', false, true);
    expect(screen.getByRole('button', { name: 'Mark exercise not complete' })).toBeDefined();
  });

  it('still names the muscle group for an exercise with no image', () => {
    seedLibrary();
    const { container } = renderCard('custom-1', true);

    expect(screen.getByText('SHOULDERS')).toBeDefined();
    expect(image(container)).toBeNull();
  });
});
