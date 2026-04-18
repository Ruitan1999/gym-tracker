import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import SaveErrorBanner from './components/layout/SaveErrorBanner';
import BottomNav from './components/layout/BottomNav';
import RestTimer from './components/workout/RestTimer';
import Toast from './components/shared/Toast';
import LogWorkoutPage from './pages/LogWorkoutPage';
import HistoryPage from './pages/HistoryPage';
import WorkoutDetailPage from './pages/WorkoutDetailPage';
import ProgressPage from './pages/ProgressPage';
import ExerciseDetailPage from './pages/ExerciseDetailPage';
import ExerciseLibraryPage from './pages/ExerciseLibraryPage';
import GroupsPage from './pages/GroupsPage';
import SettingsPage from './pages/SettingsPage';
import SignInPage from './pages/SignInPage';

function AppRoutes() {
  const location = useLocation();
  const isLogPage = location.pathname === '/' || location.pathname.startsWith('/workout/');

  return (
    <>
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
      <BottomNav />
      {false && isLogPage && <RestTimer />}
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
