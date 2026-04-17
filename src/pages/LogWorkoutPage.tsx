import { useParams, useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import WorkoutForm from '../components/workout/WorkoutForm';
import { useAppContext } from '../context/AppContext';

export default function LogWorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const { appData } = useAppContext();
  const navigate = useNavigate();

  const existingWorkout = id
    ? appData.workouts.find((w) => w.id === id)
    : undefined;

  const isEdit = !!existingWorkout;

  return (
    <PageShell
      title={isEdit ? 'Edit Workout' : 'Log Workout'}
      showBack={isEdit}
      rightAction={
        !isEdit ? (
          <button
            type="button"
            onClick={() => navigate('/exercises')}
            className="w-9 h-9 flex items-center justify-center text-gray-600 rounded-full hover:bg-gray-100"
            aria-label="Exercise library"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1h.01a1 1 0 010 2h-.01a1 1 0 01-1-1zm0 5.25a1 1 0 011-1h.01a1 1 0 010 2h-.01a1 1 0 01-1-1zm1 4.25a1 1 0 100 2h.01a1 1 0 100-2h-.01z" clipRule="evenodd" />
            </svg>
          </button>
        ) : undefined
      }
    >
      <WorkoutForm
        key={existingWorkout?.id ?? 'new'}
        existingWorkout={existingWorkout}
      />
    </PageShell>
  );
}
