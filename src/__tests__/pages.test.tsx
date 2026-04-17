import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import LogWorkoutPage from '../pages/LogWorkoutPage';
import HistoryPage from '../pages/HistoryPage';

function renderWithProviders(ui: React.ReactElement, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppProvider>{ui}</AppProvider>
    </MemoryRouter>
  );
}

describe('Page integration tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('LogWorkoutPage', () => {
    it('shows "Log Workout" title when creating a new workout', () => {
      renderWithProviders(<LogWorkoutPage />);
      expect(screen.getByText('Log Workout')).toBeDefined();
    });
  });

  describe('HistoryPage', () => {
    it('shows empty state when there are no workouts', () => {
      renderWithProviders(<HistoryPage />);
      expect(screen.getByText('No workouts yet')).toBeDefined();
      expect(screen.getByText('Log a Workout')).toBeDefined();
    });
  });
});
