import { useAppContext } from '../../context/AppContext';

export default function SaveErrorBanner() {
  const { saveError } = useAppContext();

  if (!saveError) return null;

  return (
    <div className="sticky top-0 z-50 bg-red-600 text-white text-sm text-center px-4 py-2 font-medium">
      Couldn't save — check your connection and that Firestore is set up. See console for details.
    </div>
  );
}
