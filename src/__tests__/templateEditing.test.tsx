import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import TemplateDetailPage from '../pages/TemplateDetailPage';

const STORAGE_KEY = 'gym-tracker-data';
const GROUP_ID = 'g1';

function seed() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      exercises: [
        { id: 'a', name: 'Bench Press', bodyPart: 'chest', isCustom: true },
        { id: 'b', name: 'Overhead Press', bodyPart: 'shoulders', isCustom: true },
        { id: 'c', name: 'Cable Fly', bodyPart: 'chest', isCustom: true },
      ],
      workouts: [],
      groups: [{ id: GROUP_ID, name: 'Push Day A', exerciseIds: ['a', 'b', 'c'], createdAt: '2026-01-01T00:00:00Z' }],
      dataVersion: 1,
    }),
  );
}

/** What is actually persisted, as opposed to what is on screen. */
function storedIds(): string[] {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  return raw.groups?.[0]?.exerciseIds ?? [];
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[`/groups/${GROUP_ID}`]}>
      <AppProvider>
        <Routes>
          <Route path="/groups/:id" element={<TemplateDetailPage />} />
        </Routes>
      </AppProvider>
    </MemoryRouter>,
  );
}

const removeFirst = () => {
  const buttons = screen.getAllByLabelText(/Remove .* from template/);
  fireEvent.click(buttons[0]);
};

beforeEach(() => {
  localStorage.clear();
  seed();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

describe('editing a template', () => {
  it('shows nothing to save until something changes', () => {
    renderPage();
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.queryByText(/SAVE CHANGES/)).toBeNull();
    expect(screen.queryByText(/CANCEL/)).toBeNull();
  });

  it('offers save and cancel once an exercise is removed', () => {
    renderPage();
    removeFirst();
    act(() => { vi.advanceTimersByTime(400); });

    expect(screen.getByText(/SAVE CHANGES/)).toBeTruthy();
    expect(screen.getByText(/^CANCEL$/)).toBeTruthy();
  });

  it('does not touch the stored template before save is pressed', () => {
    renderPage();
    expect(storedIds()).toEqual(['a', 'b', 'c']);

    removeFirst();
    act(() => { vi.advanceTimersByTime(400); });

    // On screen it is gone; on disk the template is untouched.
    expect(screen.queryByText('Bench Press')).toBeNull();
    expect(storedIds()).toEqual(['a', 'b', 'c']);
  });

  it('writes the change through on save', () => {
    renderPage();
    removeFirst();
    act(() => { vi.advanceTimersByTime(400); });

    fireEvent.click(screen.getByText(/SAVE CHANGES/));

    expect(storedIds()).toEqual(['b', 'c']);
    expect(screen.queryByText(/SAVE CHANGES/)).toBeNull();
  });

  it('puts the removed exercise back on cancel', () => {
    renderPage();
    removeFirst();
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.queryByText('Bench Press')).toBeNull();

    fireEvent.click(screen.getByText(/^CANCEL$/));

    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(storedIds()).toEqual(['a', 'b', 'c']);
    expect(screen.queryByText(/SAVE CHANGES/)).toBeNull();
  });

  it('marks the header unsaved while a change is pending', () => {
    const { container } = renderPage();
    expect(within(container).queryByText(/UNSAVED/)).toBeNull();

    removeFirst();
    act(() => { vi.advanceTimersByTime(400); });

    expect(within(container).getByText(/UNSAVED/)).toBeTruthy();
  });

  it('creates nothing until a new template is saved', () => {
    render(
      <MemoryRouter initialEntries={['/groups/new']}>
        <AppProvider>
          <Routes>
            <Route path="/groups/:id" element={<TemplateDetailPage />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>,
    );

    // The way out is on screen from the start, even with nothing added yet.
    expect(screen.getByText(/CREATE TEMPLATE/)).toBeTruthy();
    expect(screen.getByText(/^CANCEL$/)).toBeTruthy();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.groups).toHaveLength(1);

    fireEvent.click(screen.getByText(/CREATE TEMPLATE/));

    const after = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(after.groups).toHaveLength(2);
  });

  it('asks before leaving with a change pending', () => {
    renderPage();
    removeFirst();
    act(() => { vi.advanceTimersByTime(400); });

    fireEvent.click(screen.getByLabelText('Go back'));

    expect(screen.getByText(/Leave without saving/)).toBeTruthy();
    // Still nothing written — the question has not been answered yet.
    expect(storedIds()).toEqual(['a', 'b', 'c']);
  });
});
