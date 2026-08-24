import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import TemplateDetailPage from '../pages/TemplateDetailPage';

const STORAGE_KEY = 'gym-tracker-data';
const GROUP_ID = 'g1';

function seed(days?: number[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      exercises: [{ id: 'a', name: 'Bench Press', bodyPart: 'chest', isCustom: true }],
      workouts: [],
      groups: [
        {
          id: GROUP_ID,
          name: 'Push Day A',
          exerciseIds: ['a'],
          createdAt: '2026-01-01T00:00:00Z',
          ...(days ? { days } : {}),
        },
      ],
      dataVersion: 1,
    }),
  );
}

/** What was actually written, as opposed to what is on screen. */
function storedDays(): number[] | undefined {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  return raw.groups?.[0]?.days;
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

const openPicker = () => fireEvent.click(screen.getByLabelText(/Set the days|Workout days:/));
const pickDay = (name: string) => fireEvent.click(screen.getByLabelText(name));
const done = () => fireEvent.click(screen.getByRole('button', { name: 'DONE' }));
const save = () => fireEvent.click(screen.getByRole('button', { name: /SAVE CHANGES/ }));

beforeEach(() => {
  localStorage.clear();
  seed();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

describe('setting the days a template is trained on', () => {
  it('keeps them once the template is saved', () => {
    renderPage();

    openPicker();
    pickDay('Monday');
    pickDay('Thursday');
    done();
    save();

    expect(storedDays()).toEqual([0, 3]);
  });

  it('puts them in week order however they were picked', () => {
    renderPage();

    openPicker();
    pickDay('Friday');
    pickDay('Monday');
    pickDay('Wednesday');
    done();
    save();

    expect(storedDays()).toEqual([0, 2, 4]);
  });

  it('takes a day back off', () => {
    seed([0, 3]);
    renderPage();

    openPicker();
    pickDay('Monday');
    done();
    save();

    expect(storedDays()).toEqual([3]);
  });

  it('clears the lot', () => {
    seed([0, 2, 4]);
    renderPage();

    openPicker();
    fireEvent.click(screen.getByRole('button', { name: /CLEAR ALL DAYS/ }));
    done();
    save();

    expect(storedDays()).toEqual([]);
  });
});

describe('the schedule and the page it lives on', () => {
  it('writes nothing until the page is saved', () => {
    renderPage();

    openPicker();
    pickDay('Monday');
    done();

    // The change is on screen and marked unsaved, but not in storage.
    expect(storedDays()).toBeUndefined();
    expect(screen.getByText(/UNSAVED/)).toBeTruthy();
  });

  it('gives the days up on cancel, like anything else on the page', () => {
    seed([3]);
    renderPage();

    openPicker();
    pickDay('Monday');
    done();
    fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));

    expect(storedDays()).toEqual([3]);
    // Back to the saved state, so there is nothing left to save.
    expect(screen.queryByText(/UNSAVED/)).toBeNull();
  });

  it('leaves the days alone when only the exercises change', () => {
    seed([1, 5]);
    renderPage();

    fireEvent.click(screen.getAllByLabelText(/Remove .* from template/)[0]);
    // The row animates out before the removal lands.
    act(() => {
      vi.advanceTimersByTime(300);
    });
    save();

    expect(storedDays()).toEqual([1, 5]);
  });

  it('closes without keeping the change when the picker is dismissed', () => {
    seed([3]);
    renderPage();

    openPicker();
    pickDay('Monday');
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByText(/UNSAVED/)).toBeNull();
  });
});
