import { useState, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import SaveErrorBanner from './components/layout/SaveErrorBanner';
import BottomNav from './components/layout/BottomNav';
import Toast from './components/shared/Toast';
import LogWorkoutPage from './pages/LogWorkoutPage';
import SignInPage from './pages/SignInPage';

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

function AuthedApp({ showToast }: { showToast: (m: string) => void }) {
  const { user, loading, configured } = useAuth();

  if (!configured) {
    return <SignInPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <SignInPage />;
  }

  return (
    <AppProvider uid={user.uid} showToast={showToast}>
      <BrowserRouter>
        <SaveErrorBanner />
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default function App() {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  return (
    <AuthProvider>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <AuthedApp showToast={showToast} />
    </AuthProvider>
  );
}
