import { useState, useCallback, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useAppContext } from './context/AppContext';
import SaveErrorBanner from './components/layout/SaveErrorBanner';
import RouteErrorBoundary from './components/layout/RouteErrorBoundary';
import { lazyWithRetry, tidyReloadMarker } from './utils/lazyWithRetry';
import BottomNav from './components/layout/BottomNav';
import Toast from './components/shared/Toast';
import LoadingScreen from './components/shared/LoadingScreen';
import SessionSavedBanner, { type SessionSavedStats } from './components/shared/SessionSavedBanner';
import LogWorkoutPage from './pages/LogWorkoutPage';
import SignInPage from './pages/SignInPage';
import LandingPage from './pages/LandingPage';
import HistoryPage from './pages/HistoryPage';
import WorkoutDetailPage from './pages/WorkoutDetailPage';
import ExerciseLibraryPage from './pages/ExerciseLibraryPage';
import GroupsPage from './pages/GroupsPage';
import TemplateDetailPage from './pages/TemplateDetailPage';
import SettingsPage from './pages/SettingsPage';

// Only the chart pages are worth splitting — they pull in the charting library,
// which dwarfs the app. Every other page is a couple of kilobytes, and splitting
// them bought nothing while giving each one its own way to fail to load.
const importProgress = () => import('./pages/ProgressPage');
const importExerciseDetail = () => import('./pages/ExerciseDetailPage');

const ProgressPage = lazyWithRetry(importProgress);
const ExerciseDetailPage = lazyWithRetry(importExerciseDetail);

function prefetchAllPages() {
  for (const load of [importProgress, importExerciseDetail]) {
    load().catch(() => {
      /* the navigation itself handles a stale chunk */
    });
  }
}

function AppRoutes() {
  const { loading: appLoading } = useAppContext();

  useEffect(() => {
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (ric) {
      ric(prefetchAllPages);
    } else {
      setTimeout(prefetchAllPages, 200);
    }
  }, []);

  if (appLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <RouteErrorBoundary>
      <Suspense fallback={<div className="min-h-[100dvh]" style={{ background: 'var(--color-bg)' }} />}>
        <Routes>
          <Route path="/" element={<LogWorkoutPage />} />
          <Route path="/workout/new" element={<LogWorkoutPage />} />
          <Route path="/workout/:id" element={<LogWorkoutPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:id" element={<WorkoutDetailPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/progress/:exerciseId" element={<ExerciseDetailPage />} />
          <Route path="/exercises" element={<ExerciseLibraryPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:id" element={<TemplateDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
      </RouteErrorBoundary>
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
    return <LoadingScreen />;
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

  // Above the auth split: a reload that lands on the landing or sign-in page
  // was leaving its cache-busting marker in the address bar for good.
  useEffect(() => {
    tidyReloadMarker();
  }, []);

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
