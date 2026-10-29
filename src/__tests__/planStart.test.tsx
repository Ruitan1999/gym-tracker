import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import GroupsPage from '../pages/GroupsPage';
import { DRAFT_KEY, loadDraft, saveDraft } from '../utils/templateSession';

function seed() {
  localStorage.setItem(
    'gym-tracker-data',
    JSON.stringify({
      exercises: [{ id: 'a', name: 'Bench Press', bodyPart: 'chest', isCustom: true }],
      workouts: [],
      groups: [
        { id: 'push', name: 'Push', exerciseIds: ['a'], createdAt: '2026-01-01T00:00:00Z', days: [0] },
        { id: 'pull', name: 'Pull', exerciseIds: ['a'], createdAt: '2026-01-01T00:00:00Z', days: [3] },
        { id: 'empty', name: 'Empty', exerciseIds: [], createdAt: '2026-01-01T00:00:00Z' },
      ],
      dataVersion: 1,
    }),
  );
}

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>;
}

function renderPlan() {
  return render(
    <MemoryRouter initialEntries={['/groups']}>
      <AppProvider>
        <Routes>
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </AppProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  seed();
});

describe('Starting from Plan', () => {
  it('starts any template, not only the suggested one', () => {
    renderPlan();
    fireEvent.click(screen.getByRole('button', { name: 'Start Pull' }));
    expect(screen.getByTestId('where').textContent).toBe('/workout/new');
    expect(loadDraft()?.sourceGroupId).toBe('pull');
  });

  it('offers no Start for a template with no exercises', () => {
    renderPlan();
    expect(screen.queryByRole('button', { name: 'Start Empty' })).toBeNull();
  });

  it('asks before replacing a session with work in it, and keeps it until then', () => {
    saveDraft({
      date: '2026-10-28',
      name: 'Push',
      entries: [{ id: 'e', exerciseId: 'a', sets: [{ setNumber: 1, reps: 8, weightKg: 60 }] }],
      notes: '',
      collapsedIds: [],
      sourceGroupId: 'push',
    });
    const before = localStorage.getItem(DRAFT_KEY);
    renderPlan();
    fireEvent.click(screen.getByRole('button', { name: 'Start Pull' }));
    expect(screen.getByText(/Start "Pull" instead/)).toBeTruthy();
    expect(localStorage.getItem(DRAFT_KEY)).toBe(before);
    fireEvent.click(screen.getByRole('button', { name: /DISCARD & START/ }));
    expect(loadDraft()?.sourceGroupId).toBe('pull');
    expect(screen.getByTestId('where').textContent).toBe('/workout/new');
  });
});
