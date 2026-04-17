import { useEffect, useRef, useState } from 'react';

interface SaveGroupModalProps {
  defaultName?: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

export default function SaveGroupModal({ defaultName = '', onSave, onClose }: SaveGroupModalProps) {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-xl p-5 shadow-xl max-w-md mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Save as group</h3>
        <p className="text-sm text-gray-500 mb-3">
          Give this workout a name so you can start from it next time.
        </p>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="e.g. Leg day, Arm day"
          className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg text-[16px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!name.trim()}
            className="flex-1 min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
