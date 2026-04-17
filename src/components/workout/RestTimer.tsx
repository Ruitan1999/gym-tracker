import { useState, useEffect, useRef } from 'react';

const PRESETS = [30, 60, 90, 120, 180];

export default function RestTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [targetSeconds, setTargetSeconds] = useState(90);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hasFinished, setHasFinished] = useState(false);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            setIsRunning(false);
            setHasFinished(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, seconds]);

  function startTimer(secs: number) {
    setTargetSeconds(secs);
    setSeconds(secs);
    setIsRunning(true);
    setHasFinished(false);
  }

  function stopTimer() {
    setIsRunning(false);
    setSeconds(0);
    setHasFinished(false);
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = targetSeconds > 0 ? ((targetSeconds - seconds) / targetSeconds) * 100 : 0;

  // Floating button when closed, or when timer is running show mini display
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white font-bold transition-all ${
          isRunning
            ? 'bg-blue-600 animate-pulse'
            : hasFinished
            ? 'bg-green-500'
            : 'bg-gray-700'
        }`}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        {isRunning ? (
          <span className="text-sm tabular-nums">{mins}:{String(secs).padStart(2, '0')}</span>
        ) : hasFinished ? (
          <span className="text-xs">GO!</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setIsOpen(false)} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl p-6 animate-[slideUp_0.2s_ease-out]"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">Rest Timer</h3>

        {/* Timer display */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          {/* Background circle */}
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#F3F4F6" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke={hasFinished ? '#16A34A' : '#2563EB'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-bold tabular-nums ${hasFinished ? 'text-green-600' : 'text-gray-900'}`}>
              {hasFinished ? 'Go!' : `${mins}:${String(secs).padStart(2, '0')}`}
            </span>
          </div>
        </div>

        {/* Presets */}
        <div className="flex justify-center gap-2 mb-4">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => startTimer(p)}
              className={`px-3 h-9 rounded-full text-sm font-medium ${
                targetSeconds === p && isRunning
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              {p >= 60 ? `${p / 60}m` : `${p}s`}
            </button>
          ))}
        </div>

        {/* Stop button */}
        {(isRunning || hasFinished) && (
          <button
            type="button"
            onClick={stopTimer}
            className="w-full min-h-[44px] rounded-lg bg-gray-100 text-gray-700 font-medium"
          >
            {hasFinished ? 'Dismiss' : 'Stop'}
          </button>
        )}
      </div>
    </>
  );
}
