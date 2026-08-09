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
    it('gives the home page over to the momentum panel instead of a title', () => {
      renderWithProviders(<LogWorkoutPage />);
      expect(screen.queryByText('Log Session')).toBeNull();
      expect(screen.getByText('MOMENTUM')).toBeDefined();
      expect(screen.getByRole('button', { name: /LOG WORKOUT/ })).toBeDefined();
    });

    it('shows the session title when creating a new workout', () => {
      renderWithProviders(<LogWorkoutPage />, { route: '/workout/new' });
      expect(screen.getByText('New Session')).toBeDefined();
    });
  });

  describe('HistoryPage', () => {
    it('shows empty state when there are no workouts', () => {
      renderWithProviders(<HistoryPage />);
      expect(screen.getByText('No sessions logged yet')).toBeDefined();
      expect(screen.getByText(/Start First Session/)).toBeDefined();
    });
  });
});
