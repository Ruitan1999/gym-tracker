import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import GroupsPage from './pages/GroupsPage';
import TemplateDetailPage from './pages/TemplateDetailPage';
import { DEFAULT_EXERCISES } from './data/defaultExercises';
import { DEFAULT_PREFERENCES } from './types';
import './index.css';

function seed() {
  const data = {
    exercises: DEFAULT_EXERCISES,
    workouts: [],
    preferences: DEFAULT_PREFERENCES,
    dataVersion: 1,
    groups: [
      {
        id: 'tpl-1',
        name: 'Push Day A',
        exerciseIds: ['ex-push-001', 'ex-push-002', 'ex-push-003'],
        createdAt: '2026-07-01T10:00:00.000Z',
      },
      {
        id: 'tpl-2',
        name: 'Pull Day',
        exerciseIds: ['ex-pull-001', 'ex-pull-002', 'ex-pull-003', 'ex-pull-004', 'ex-pull-005'],
        createdAt: '2026-07-02T10:00:00.000Z',
      },
      {
        id: 'tpl-3',
        name: 'Leg Day',
        exerciseIds: ['ex-legs-001', 'ex-legs-002'],
        createdAt: '2026-07-03T10:00:00.000Z',
      },
      {
        id: 'tpl-4',
        name: 'Empty Template',
        exerciseIds: [],
        createdAt: '2026-07-04T10:00:00.000Z',
      },
    ],
  };
  localStorage.setItem('gym-tracker-data', JSON.stringify(data));
}

seed();

const start = new URLSearchParams(location.search).get('at') ?? '/groups';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MemoryRouter initialEntries={[start]}>
      <AppProvider>
        <Routes>
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:id" element={<TemplateDetailPage />} />
        </Routes>
      </AppProvider>
    </MemoryRouter>
  </StrictMode>,
);
