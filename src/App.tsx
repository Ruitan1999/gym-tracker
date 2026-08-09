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

const importHistory = () => import('./pages/HistoryPage');
const importWorkoutDetail = () => import('./pages/WorkoutDetailPage');
const importProgress = () => import('./pages/ProgressPage');
const importExerciseDetail = () => import('./pages/ExerciseDetailPage');
const importExerciseLibrary = () => import('./pages/ExerciseLibraryPage');
const importGroups = () => import('./pages/GroupsPage');
const importTemplateDetail = () => import('./pages/TemplateDetailPage');
const importSettings = () => import('./pages/SettingsPage');

const HistoryPage = lazyWithRetry(importHistory);
const WorkoutDetailPage = lazyWithRetry(importWorkoutDetail);
const ProgressPage = lazyWithRetry(importProgress);
const ExerciseDetailPage = lazyWithRetry(importExerciseDetail);
const ExerciseLibraryPage = lazyWithRetry(importExerciseLibrary);
const GroupsPage = lazyWithRetry(importGroups);
const TemplateDetailPage = lazyWithRetry(importTemplateDetail);
const SettingsPage = lazyWithRetry(importSettings);

function prefetchAllPages() {
  for (const load of [
    importHistory,
    importProgress,
    importSettings,
    importWorkoutDetail,
    importExerciseDetail,
    importExerciseLibrary,
    importGroups,
    importTemplateDetail,
  ]) {
    load().catch(() => {
      /* the navigation itself handles a stale chunk */
    });
  }
}

function AppRoutes() {
  const { loading: appLoading } = useAppContext();

  useEffect(() => {
    tidyReloadMarker();
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
