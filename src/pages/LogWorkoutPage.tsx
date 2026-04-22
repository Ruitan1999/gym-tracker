import { useLocation, useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import WorkoutForm from '../components/workout/WorkoutForm';
import WeeklyInsights from '../components/workout/WeeklyInsights';
import TodayWork from '../components/workout/TodayWork';
import { useAppContext } from '../context/AppContext';

export default function LogWorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { appData } = useAppContext();

  const isNewFocused = location.pathname === '/workout/new';
  const existingWorkout =
    id && !isNewFocused ? appData.workouts.find((w) => w.id === id) : undefined;

  const isEdit = !!existingWorkout;
  const autoOpenSelect = isNewFocused && (location.state as { autoOpenSelect?: boolean } | null)?.autoOpenSelect === true;

  return (
    <PageShell
      title={isEdit ? 'Edit Session' : isNewFocused ? 'New Session' : 'Log Session'}
      eyebrow={isEdit ? 'REVISE ENTRY' : undefined}
      showBack={isEdit || isNewFocused}
      topSlot={
        !isEdit && !isNewFocused ? (
          <>
            <WeeklyInsights />
            <TodayWork />
          </>
        ) : undefined
      }
      hideTitle={!isEdit && !isNewFocused}
    >
      <WorkoutForm
        key={existingWorkout?.id ?? (isNewFocused ? 'focused-new' : 'new')}
        existingWorkout={existingWorkout}
        autoOpenSelect={autoOpenSelect}
      />
    </PageShell>
  );
}
