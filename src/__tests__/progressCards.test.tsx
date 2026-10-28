import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import YearHeatmap from '../components/progress/YearHeatmap';
import MuscleBalance from '../components/progress/MuscleBalance';
import type { Exercise, Workout } from '../types';

const NOW = new Date(2026, 9, 28, 18, 0);

const exercises: Exercise[] = [
  { id: 'bench', name: 'Bench', bodyPart: 'chest', isCustom: false },
];

const sessions: Workout[] = [
  {
    id: 'a',
    date: '2026-10-27',
    createdAt: new Date(2026, 9, 27, 18).toISOString(),
    startedAt: new Date(2026, 9, 27, 17, 6).toISOString(),
    entries: [
      { id: 'e', exerciseId: 'bench', sets: [{ setNumber: 1, reps: 10, weightKg: 50 }] },
    ],
  },
  {
    id: 'b',
    date: '2026-10-20',
    createdAt: new Date(2026, 9, 20, 18).toISOString(),
    entries: [
      { id: 'e', exerciseId: 'bench', sets: [{ setNumber: 1, reps: 10, weightKg: 20 }] },
    ],
  },
];

describe('YearHeatmap', () => {
  it('exposes each past day as a labelled button and none for days to come', () => {
    render(<YearHeatmap workouts={sessions} unit="kg" today={NOW} />);
    expect(screen.getByRole('button', { name: '27 Oct, 500 kg' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '28 Oct, no workout' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^29 Oct, / })).toBeNull();
    // The same date a year back is told apart by its year.
    expect(screen.getByRole('button', { name: '28 Oct 2025, no workout' })).toBeTruthy();
  });

  it('shows a tapped day in the readout line', () => {
    render(<YearHeatmap workouts={sessions} unit="kg" today={NOW} />);
    fireEvent.click(screen.getByRole('button', { name: '27 Oct, 500 kg' }));
    expect(screen.getByText('27 Oct, 500 kg', { selector: 'p' })).toBeTruthy();
  });

  it('switches to minutes, and only mentions untimed sessions while on Time', () => {
    render(<YearHeatmap workouts={sessions} unit="kg" today={NOW} />);
    expect(screen.queryByText(/no start time and is left out/)).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Time' }));
    expect(screen.getByRole('button', { name: '27 Oct, 54 min' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '20 Oct, workout, no start time' })).toBeTruthy();
    expect(screen.getByText(/1 older session has no start time and is left out/)).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Volume' }));
    expect(screen.queryByText(/left out/)).toBeNull();
  });

  it('uses the chosen weight unit', () => {
    render(<YearHeatmap workouts={sessions} unit="lb" today={NOW} />);
    expect(screen.getByRole('button', { name: '27 Oct, 1.1K lb' })).toBeTruthy();
  });

  it('renders for no workouts', () => {
    render(<YearHeatmap workouts={[]} unit="kg" today={NOW} />);
    expect(screen.getByText('No sessions in the last 12 months')).toBeTruthy();
  });
});

describe('MuscleBalance', () => {
  it('lists untrained body parts first, and sets per part in Balance', () => {
    render(<MuscleBalance workouts={sessions} exercises={exercises} now={NOW} />);
    const rows = () => screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(rows()[0]).toBe('BACK0 sets');
    expect(rows().join()).not.toContain('CHEST');

    fireEvent.click(screen.getByRole('radio', { name: 'Balance' }));
    expect(rows()).toEqual(['CHEST2 sets']);
  });

  it('narrows the period', () => {
    render(<MuscleBalance workouts={sessions} exercises={exercises} now={NOW} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Balance' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Week' }));
    expect(screen.getByText('1 set')).toBeTruthy();
  });

  it('lists what trained in the last 48 hours under Recovering', () => {
    render(<MuscleBalance workouts={sessions} exercises={exercises} now={NOW} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Recovering' }));
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['CHESTwithin 48h']);
  });

  it('says so when nothing is logged', () => {
    render(<MuscleBalance workouts={[]} exercises={exercises} now={NOW} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Balance' }));
    expect(screen.getByText('No sets logged in this period.')).toBeTruthy();
  });
});
