import { useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import WorkoutForm from '../components/workout/WorkoutForm';
import WeeklyInsights from '../components/workout/WeeklyInsights';
import { useAppContext } from '../context/AppContext';

export default function LogWorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const { appData } = useAppContext();

  const existingWorkout = id
    ? appData.workouts.find((w) => w.id === id)
    : undefined;

  const isEdit = !!existingWorkout;

  return (
    <PageShell
      title={isEdit ? 'Edit Session' : 'Log Session'}
      eyebrow={isEdit ? 'REVISE ENTRY' : undefined}
      showBack={isEdit}
      topSlot={!isEdit ? <WeeklyInsights /> : undefined}
    >
      <WorkoutForm
        key={existingWorkout?.id ?? 'new'}
        existingWorkout={existingWorkout}
      />
    </PageShell>
  );
}
