import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import HistoryPage from '../pages/HistoryPage';
import { tonnageKg, formatTonnage } from '../utils/tonnage';
import type { Workout } from '../types';

const wo = (date: string, sets: Array<[number, number]>): Workout => ({
  id: date,
  date,
  createdAt: `${date}T12:00:00.000Z`,
  entries: [
    {
      id: 'e',
      exerciseId: 'x',
      sets: sets.map(([reps, weightKg], i) => ({ setNumber: i + 1, reps, weightKg })),
    },
  ],
});

describe('tonnageKg', () => {
  it('is zero for no history, never NaN', () => {
    expect(tonnageKg([], '2026-08')).toEqual({ total: 0, thisMonth: 0 });
  });

  it('sums reps x weight and splits out the month', () => {
    const r = tonnageKg(
      [wo('2026-08-03', [[10, 100], [5, 50]]), wo('2026-07-30', [[10, 20]])],
      '2026-08',
    );
    expect(r).toEqual({ total: 1450, thisMonth: 1250 });
  });

  it('ignores empty sets and bad values', () => {
    const r = tonnageKg(
      [wo('2026-08-03', [[0, 100], [10, 0], [NaN, 50], [5, 20]])],
      '2026-08',
    );
    expect(r.total).toBe(100);
  });
});

describe('formatTonnage', () => {
  it('groups digits and converts to lb', () => {
    expect(formatTonnage(307450, 'kg')).toBe('307,450');
    expect(formatTonnage(1000, 'lb')).toBe('2,205');
    expect(formatTonnage(0, 'kg')).toBe('0');
  });
  it('abbreviates past nine digits', () => {
    expect(formatTonnage(2.5e9, 'kg')).toBe('2.5B');
  });
});

describe('Log Book stat tiles', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-08-22T10:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  function renderWith(workouts: Workout[], weightUnit: 'kg' | 'lb' = 'kg') {
    localStorage.setItem(
      'gym-tracker-data',
      JSON.stringify({
        exercises: [],
        workouts,
        groups: [],
        preferences: { weightUnit, quickReps: [8], weightStepKg: 2.5, weightStepLb: 5 },
        dataVersion: 1,
      }),
    );
    render(
      <MemoryRouter>
        <AppProvider>
          <HistoryPage />
        </AppProvider>
      </MemoryRouter>,
    );
    return within(screen.getByLabelText('Totals'));
  }

  it('shows the four tiles with lifetime and monthly tonnage', () => {
    const t = renderWith([wo('2026-08-03', [[10, 100]]), wo('2026-06-03', [[10, 50]])]);
    for (const l of ['WORKOUTS', 'THIS MONTH', 'WEEK STREAK', 'LIFTED IN TOTAL'])
      expect(t.getByText(l)).toBeTruthy();
    expect(t.getByText('1,500')).toBeTruthy();
    expect(t.getByText('1,000 kg this month')).toBeTruthy();
  });

  it('keeps a seven-digit total whole and shrinks it so it cannot clip', () => {
    const t = renderWith([wo('2026-08-03', [[10, 123456.7]])]);
    const big = t.getByText('1,234,567');
    expect(big.style.fontSize).toBe('1.25rem');
    expect(big.className).toContain('truncate');
  });

  it('shows the total in the preferred unit', () => {
    const t = renderWith([wo('2026-08-03', [[10, 100]])], 'lb');
    expect(t.getByText('2,205')).toBeTruthy();
    expect(t.getByText('LB')).toBeTruthy();
  });
});
