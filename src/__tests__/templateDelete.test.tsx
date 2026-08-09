import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import GroupsPage from '../pages/GroupsPage';
import type { WorkoutGroup } from '../types';

const STORAGE_KEY = 'gym-tracker-data';

const templates: WorkoutGroup[] = [
  { id: 'g1', name: 'Push Day A', exerciseIds: ['ex-push-001'], createdAt: '2026-07-01T10:00:00.000Z' },
  { id: 'g2', name: 'Leg Day', exerciseIds: ['ex-legs-001'], createdAt: '2026-07-02T10:00:00.000Z' },
];

function seed() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ workouts: [], groups: templates, dataVersion: 1 }),
  );
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/groups']}>
      <AppProvider>
        <Routes>
          <Route path="/groups" element={<GroupsPage />} />
        </Routes>
      </AppProvider>
    </MemoryRouter>,
  );
}

function storedGroups(): WorkoutGroup[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)!).groups;
}

function openMenu(name: string) {
  fireEvent.click(screen.getByRole('button', { name: `Actions for ${name}` }));
}

describe('Deleting a template from the manage list', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('offers delete alongside the other actions', () => {
    seed();
    renderPage();
    openMenu('Push Day A');

    expect(screen.getByRole('menuitem', { name: 'EDIT EXERCISES' })).toBeDefined();
    expect(screen.getByRole('menuitem', { name: 'RENAME' })).toBeDefined();
    expect(screen.getByRole('menuitem', { name: 'DELETE' })).toBeDefined();
  });

  it('confirms before deleting, and keeps it if you back out', () => {
    seed();
    renderPage();
    openMenu('Push Day A');
    fireEvent.click(screen.getByRole('menuitem', { name: 'DELETE' }));
    fireEvent.click(screen.getByRole('button', { name: 'KEEP' }));

    expect(storedGroups()).toHaveLength(2);
    expect(screen.getByText('Push Day A')).toBeDefined();
  });

  it('removes only the template you chose', () => {
    seed();
    renderPage();
    openMenu('Push Day A');
    fireEvent.click(screen.getByRole('menuitem', { name: 'DELETE' }));
    fireEvent.click(screen.getByRole('button', { name: 'DELETE →' }));

    expect(storedGroups().map((g) => g.name)).toEqual(['Leg Day']);
    expect(screen.queryByText('Push Day A')).toBeNull();
  });

  it('no longer offers a drag grip', () => {
    seed();
    renderPage();
    expect(screen.queryByRole('button', { name: /Drag to reorder/ })).toBeNull();
    expect(screen.getByText(/HOLD TO REORDER/)).toBeDefined();
  });
});
