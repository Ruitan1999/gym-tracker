import { useAppContext } from '../context/AppContext';
import { trainingModeOf } from './rotation';
import { todayString } from './templateSession';
import { thisWeekFor, type ThisWeek } from './thisWeek';

/** This week for the signed-in data, shared by every card that shows it. */
export function useThisWeek(): ThisWeek {
  const { appData } = useAppContext();
  return thisWeekFor(
    appData.workouts,
    appData.groups,
    trainingModeOf(appData.preferences),
    todayString(),
  );
}
