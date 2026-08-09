import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import WorkoutForm, { loadDraft } from '../components/workout/WorkoutForm';
import WeeklyInsights from '../components/workout/WeeklyInsights';
import TodayWork from '../components/workout/TodayWork';
import RenameModal from '../components/shared/RenameModal';
import { useAppContext } from '../context/AppContext';
import type { Workout } from '../types';

export default function LogWorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { appData } = useAppContext();

  const isNewFocused = location.pathname === '/workout/new';
  const existingWorkout =
    id && !isNewFocused ? appData.workouts.find((w) => w.id === id) : undefined;
  const autoOpenSelect =
    isNewFocused && (location.state as { autoOpenSelect?: boolean } | null)?.autoOpenSelect === true;

  // Every one of these routes renders this same component, so React keeps the
  // instance alive across them. Keying on the session means starting a workout
  // reads the draft fresh instead of holding the home page's empty name.
  return (
    <SessionPage
      key={existingWorkout?.id ?? (isNewFocused ? 'focused-new' : 'new')}
      existingWorkout={existingWorkout}
      isNewFocused={isNewFocused}
      autoOpenSelect={autoOpenSelect}
    />
  );
}

function SessionPage({
  existingWorkout,
  isNewFocused,
  autoOpenSelect,
}: {
  existingWorkout?: Workout;
  isNewFocused: boolean;
  autoOpenSelect: boolean;
}) {
  const isEdit = !!existingWorkout;

  // The session's name is the page title, so it lives here rather than in the
  // form — there's no second field for it.
  const [name, setName] = useState(
    () => existingWorkout?.name ?? (isEdit ? '' : loadDraft()?.name) ?? '',
  );
  const [showRename, setShowRename] = useState(false);

  const isSession = isEdit || isNewFocused;
  const fallbackTitle = isEdit ? 'Edit Session' : isNewFocused ? 'New Session' : 'Log Session';

  return (
    <PageShell
      title={isSession ? name || fallbackTitle : fallbackTitle}
      onTitlePress={isSession ? () => setShowRename(true) : undefined}
      titlePressLabel={name ? 'Rename this session' : 'Name this session'}
      eyebrow={isEdit ? 'REVISE ENTRY' : undefined}
      showBack={isSession}
      topSlot={
        !isSession ? (
          <>
            <WeeklyInsights />
            <TodayWork />
          </>
        ) : undefined
      }
      hideTitle={!isSession}
      disableRefresh={isSession}
    >
      <WorkoutForm
        existingWorkout={existingWorkout}
        autoOpenSelect={autoOpenSelect}
        name={name}
        onNameChange={setName}
      />

      {showRename && (
        <RenameModal
          eyebrow={name ? 'RENAME SESSION' : 'NAME SESSION'}
          title={name ? 'Rename this session' : 'Name this session'}
          initialValue={name}
          placeholder="e.g. Push Day A"
          allowEmpty
          onSave={(value) => {
            setName(value);
            setShowRename(false);
          }}
          onClose={() => setShowRename(false)}
        />
      )}
    </PageShell>
  );
}
