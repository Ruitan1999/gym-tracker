import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppGuide, { GUIDE_STEPS } from '../components/guide/AppGuide';
import { shouldShowGuide } from '../utils/guide';
import { DEFAULT_PREFERENCES, type Workout } from '../types';

function renderGuide(onDone = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<AppGuide onDone={onDone} />} />
        <Route path="/groups" element={<p>Plan page</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return onDone;
}

describe('shouldShowGuide', () => {
  const workout = { id: 'w', date: '2026-10-01', createdAt: '', entries: [] } as Workout;

  it('shows to an account with nothing in it yet', () => {
    expect(shouldShowGuide({ preferences: DEFAULT_PREFERENCES, workouts: [], groups: [] })).toBe(true);
  });

  it('does not show to someone already using the app', () => {
    expect(shouldShowGuide({ preferences: DEFAULT_PREFERENCES, workouts: [workout], groups: [] })).toBe(false);
  });

  it('does not come back once seen, but does when asked for', () => {
    expect(
      shouldShowGuide({ preferences: { ...DEFAULT_PREFERENCES, guideSeen: true }, workouts: [], groups: [] }),
    ).toBe(false);
    expect(
      shouldShowGuide({ preferences: { ...DEFAULT_PREFERENCES, guideSeen: false }, workouts: [workout], groups: [] }),
    ).toBe(true);
  });
});

describe('AppGuide', () => {
  it('clicks through every step and ends on Plan', () => {
    const onDone = renderGuide();
    fireEvent.click(screen.getByRole('button', { name: 'Show me' }));
    for (let i = 1; i < GUIDE_STEPS.length - 1; i++) {
      expect(screen.getByRole('heading', { name: GUIDE_STEPS[i].title })).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    }
    fireEvent.click(screen.getByRole('button', { name: /Make my first template/ }));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Plan page')).toBeTruthy();
  });

  it('can go back a step', () => {
    renderGuide();
    fireEvent.click(screen.getByRole('button', { name: 'Show me' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('heading', { name: GUIDE_STEPS[0].title })).toBeTruthy();
  });

  it('can be skipped', () => {
    const onDone = renderGuide();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('lets the reps and weight be tried out', () => {
    renderGuide();
    fireEvent.click(screen.getByRole('button', { name: 'Show me' }));
    while (!screen.queryByRole('heading', { name: 'Log each set' })) {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Set reps to 10' }));
    expect(screen.getByRole('button', { name: 'Set reps to 10' }).getAttribute('aria-pressed')).toBe('true');
  });
});
