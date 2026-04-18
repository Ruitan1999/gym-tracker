import { useState, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import SaveErrorBanner from './components/layout/SaveErrorBanner';
import BottomNav from './components/layout/BottomNav';
import Toast from './components/shared/Toast';
import SessionSavedBanner, { type SessionSavedStats } from './components/shared/SessionSavedBanner';
import LogWorkoutPage from './pages/LogWorkoutPage';
import SignInPage from './pages/SignInPage';
import LandingPage from './pages/LandingPage';

const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const WorkoutDetailPage = lazy(() => import('./pages/WorkoutDetailPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const ExerciseDetailPage = lazy(() => import('./pages/ExerciseDetailPage'));
const ExerciseLibraryPage = lazy(() => import('./pages/ExerciseLibraryPage'));
const GroupsPage = lazy(() => import('./pages/GroupsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function AppRoutes() {
  return (
    <>
      <Suspense fallback={<div className="min-h-[100dvh]" style={{ background: 'var(--color-bg)' }} />}>
        <Routes>
          <Route path="/" element={<LogWorkoutPage />} />
          <Route path="/workout/:id" element={<LogWorkoutPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:id" element={<WorkoutDetailPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/progress/:exerciseId" element={<ExerciseDetailPage />} />
          <Route path="/exercises" element={<ExerciseLibraryPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
      <BottomNav />
    </>
  );
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<SignInPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AuthedApp({
  showToast,
  showSessionSaved,
}: {
  showToast: (m: string) => void;
  showSessionSaved: (s: SessionSavedStats) => void;
}) {
  const { user, loading, configured } = useAuth();

  if (!configured) {
    return (
      <BrowserRouter>
        <PublicRoutes />
      </BrowserRouter>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <PublicRoutes />
      </BrowserRouter>
    );
  }

  return (
    <AppProvider uid={user.uid} showToast={showToast} showSessionSaved={showSessionSaved}>
      <BrowserRouter>
        <SaveErrorBanner />
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default function App() {
  const [toast, setToast] = useState<string | null>(null);
  const [sessionSaved, setSessionSaved] = useState<SessionSavedStats | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  const showSessionSaved = useCallback((stats: SessionSavedStats) => {
    setSessionSaved(stats);
  }, []);

  return (
    <AuthProvider>
      {sessionSaved && (
        <SessionSavedBanner stats={sessionSaved} onClose={() => setSessionSaved(null)} />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <AuthedApp showToast={showToast} showSessionSaved={showSessionSaved} />
    </AuthProvider>
  );
}
