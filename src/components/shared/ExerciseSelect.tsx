import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import type { ExerciseCategory } from '../../types';

interface ExerciseSelectProps {
  onSelect: (exerciseId: string) => void;
  onClose: () => void;
}

const CATEGORY_ORDER: ExerciseCategory[] = ['push', 'pull', 'legs', 'core', 'cardio'];
const CATEGORY_CODE: Record<ExerciseCategory, string> = {
  push: 'PSH',
  pull: 'PLL',
  legs: 'LEG',
  core: 'COR',
  cardio: 'CRD',
};
const CATEGORY_ACCENT: Record<ExerciseCategory, string> = {
  push: 'var(--color-volt)',
  pull: 'var(--color-ember)',
  legs: 'var(--color-rust)',
  core: 'var(--color-volt)',
  cardio: 'var(--color-ember)',
};

export default function ExerciseSelect({ onSelect, onClose }: ExerciseSelectProps) {
  const { appData, addExercise } = useAppContext();
  const [filter, setFilter] = useState('');
  const [choosingCategoryFor, setChoosingCategoryFor] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const [closing, setClosing] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const closedRef = useRef(false);
  const lastMoveRef = useRef<{ y: number; t: number } | null>(null);
  const velocityRef = useRef(0);

  const handleClose = () => {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose();
  };

  useEffect(() => {
    const tag = 'exercise-select';
    let pushed = false;
    const prevState = window.history.state;
    const timeoutId = window.setTimeout(() => {
      window.history.pushState({ ...(prevState ?? {}), [tag]: true }, '');
      pushed = true;
    }, 0);
    const onPop = () => {
      if (!pushed) return;
      if (closedRef.current) return;
      closedRef.current = true;
      pushed = false;
      onClose();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('popstate', onPop);
      if (pushed) {
        window.history.back();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSheetTouchStart(e: React.TouchEvent) {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    const scroller = scrollRef.current;
    const withinScroller = scroller && scroller.contains(target);
    if (withinScroller && scroller!.scrollTop > 0) {
      dragStartYRef.current = null;
      return;
    }
    const y = e.touches[0].clientY;
    dragStartYRef.current = y;
    draggingRef.current = false;
    lastMoveRef.current = { y, t: performance.now() };
    velocityRef.current = 0;
  }

  function onSheetTouchMove(e: React.TouchEvent) {
    e.stopPropagation();
    if (dragStartYRef.current == null) return;
    const scroller = scrollRef.current;
    if (scroller && scroller.scrollTop > 0 && !draggingRef.current) {
      dragStartYRef.current = null;
      return;
    }
    const y = e.touches[0].clientY;
    const dy = y - dragStartYRef.current;
    const now = performance.now();
    const last = lastMoveRef.current;
    if (last) {
      const dt = now - last.t;
      if (dt > 0) velocityRef.current = (y - last.y) / dt;
    }
    lastMoveRef.current = { y, t: now };
    if (dy <= 0) {
      setDragY(0);
      return;
    }
    draggingRef.current = true;
    setDragY(dy);
  }

  function onSheetTouchEnd(e: React.TouchEvent) {
    e.stopPropagation();
    const dy = dragY;
    const v = velocityRef.current;
    dragStartYRef.current = null;
    draggingRef.current = false;
    lastMoveRef.current = null;
    const shouldClose = dy > 60 || (dy > 20 && v > 0.5);
    if (shouldClose) {
      setClosing(true);
      setDragY(window.innerHeight);
      setTimeout(handleClose, 220);
    } else {
      setDragY(0);
    }
  }

  const recentExerciseIds = useMemo(() => {
    const seen = new Set<string>();
    const recent: string[] = [];
    const sorted = [...appData.workouts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    for (const w of sorted.slice(0, 10)) {
      for (const entry of w.entries) {
        if (!seen.has(entry.exerciseId)) {
          seen.add(entry.exerciseId);
          recent.push(entry.exerciseId);
        }
      }
      if (recent.length >= 10) break;
    }
    return recent;
  }, [appData.workouts]);

  const recentExercises = useMemo(
    () => recentExerciseIds
      .map((id) => appData.exercises.find((e) => e.id === id))
      .filter(Boolean),
    [recentExerciseIds, appData.exercises]
  );

  const isSearching = filter.length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const lower = filter.toLowerCase();
    return appData.exercises.filter((e) => e.name.toLowerCase().includes(lower));
  }, [appData.exercises, filter, isSearching]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, typeof appData.exercises> = {};
    for (const cat of CATEGORY_ORDER) {
      groups[cat] = appData.exercises.filter((e) => e.category === cat);
    }
    return groups;
  }, [appData.exercises]);

  return (
    <>
      <div
        className="fixed inset-0 z-[60]"
        style={{
          background: 'rgba(5,5,5,0.72)',
          backdropFilter: 'blur(6px)',
          opacity: Math.max(0, 1 - dragY / 400),
          transition: dragY === 0 && !closing ? 'opacity 0.2s' : undefined,
        }}
        onClick={handleClose}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      />

      <div
        className={`fixed inset-x-0 bottom-0 z-[60] h-[88dvh] flex flex-col ${dragY === 0 && !closing ? 'animate-[slideUp_0.22s_ease-out]' : ''}`}
        style={{
          background: 'var(--color-elev)',
          borderTop: '1px solid var(--color-line-2)',
          transform: dragY > 0 || closing ? `translateY(${dragY}px)` : undefined,
          opacity: closing ? 0 : Math.max(0.2, 1 - dragY / 500),
          transition: closing
            ? 'transform 0.22s ease-in, opacity 0.22s ease-in'
            : dragY === 0
              ? 'transform 0.2s, opacity 0.2s'
              : undefined,
          touchAction: 'pan-y',
        }}
        onTouchStart={onSheetTouchStart}
        onTouchMove={onSheetTouchMove}
        onTouchEnd={onSheetTouchEnd}
        onTouchCancel={onSheetTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1.5">
          <div className="w-10 h-[3px]" style={{ background: 'var(--color-line-3)' }} />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3 flex items-end justify-between">
          <div>
            <h3
              className="font-display"
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--color-text)',
              }}
            >
              Add to session
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="h-10 px-3 caps-tight text-[10px] press"
            style={{ color: 'var(--color-text-muted)' }}
          >
            CLOSE ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <input
            type="text"
            placeholder="SEARCH TYPE TO FILTER"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full h-12 px-3 font-mono outline-none"
            style={{
              background: 'var(--color-ink)',
              border: '1px solid var(--color-line-2)',
              borderRadius: '2px',
              fontSize: '16px',
              letterSpacing: '0.02em',
              color: 'var(--color-text)',
            }}
          />
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-8">
          {isSearching ? (
            <div>
              {searchResults.length === 0 ? (
                <div className="pt-2">
                  {choosingCategoryFor === null ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        (e.currentTarget as HTMLButtonElement).blur();
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }
                        setChoosingCategoryFor(filter.trim());
                      }}
                      className="w-full press flex items-center justify-center gap-2 h-14"
                      style={{
                        color: 'var(--color-volt)',
                        background: 'rgba(243, 91, 38, 0.08)',
                        border: '1.5px dashed var(--color-volt)',
                        borderRadius: '2px',
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" className="w-5 h-5">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      <span
                        className="font-display"
                        style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.015em' }}
                      >
                        Add "{filter.trim()}" to library
                      </span>
                    </button>
                  ) : (
                    <div>
                      <div
                        className="caps text-[10px] mb-3"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        WHAT TYPE OF EXERCISE IS "{choosingCategoryFor.toUpperCase()}"?
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {CATEGORY_ORDER.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              const newExercise = {
                                id: crypto.randomUUID(),
                                name: choosingCategoryFor,
                                category: cat,
                                isCustom: true,
                              };
                              addExercise(newExercise);
                              setChoosingCategoryFor(null);
                              setFilter('');
                              onSelect(newExercise.id);
                            }}
                            className="w-full h-14 px-4 flex items-center justify-between press"
                            style={{
                              background: '#ffffff',
                              border: `1px solid ${CATEGORY_ACCENT[cat]}`,
                              borderRadius: '2px',
                            }}
                          >
                            <span
                              className="font-display"
                              style={{
                                color: 'var(--color-text)',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                letterSpacing: '-0.015em',
                              }}
                            >
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </span>
                            <span
                              className="caps-tight text-[9px] px-2 py-0.5"
                              style={{
                                color: CATEGORY_ACCENT[cat],
                                border: `1px solid ${CATEGORY_ACCENT[cat]}`,
                                borderRadius: '2px',
                              }}
                            >
                              {CATEGORY_CODE[cat]}
                            </span>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setChoosingCategoryFor(null)}
                        className="w-full h-12 mt-3 caps-tight text-[10px] press"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        ← BACK
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <ul>
                  {searchResults.map((ex, i) => (
                    <li key={ex.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(ex.id)}
                        className="w-full text-left h-14 px-2 flex items-center gap-3 press"
                        style={{
                          borderBottom: '1px solid var(--color-line)',
                          borderTop: i === 0 ? '1px solid var(--color-line)' : undefined,
                        }}
                      >
                        <span
                          className="font-mono text-[10px] w-8"
                          style={{ color: 'var(--color-text-faint)' }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          className="flex-1 text-[15px]"
                          style={{ color: 'var(--color-text)', fontWeight: 500 }}
                        >
                          {ex.name}
                        </span>
                        <span
                          className="caps-tight text-[9px] px-2 py-0.5"
                          style={{
                            color: CATEGORY_ACCENT[ex.category],
                            border: `1px solid ${CATEGORY_ACCENT[ex.category]}`,
                            borderRadius: '2px',
                          }}
                        >
                          {CATEGORY_CODE[ex.category]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {recentExercises.length > 0 && (
                <div>
                  <div className="caps text-[10px] mb-2.5 flex items-center gap-3">
                    <span style={{ color: 'var(--color-text)' }}>00</span>
                    <span style={{ color: 'var(--color-text)' }}>RECENT</span>
                    <span className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentExercises.map((ex) => ex && (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => onSelect(ex.id)}
                        className="h-10 px-3 text-[13px] press"
                        style={{
                          background: 'transparent',
                          color: 'var(--color-text)',
                          border: '1px solid var(--color-volt)',
                          borderRadius: '2px',
                          fontWeight: 500,
                        }}
                      >
                        {ex.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {CATEGORY_ORDER.map((cat, idx) => {
                const list = groupedByCategory[cat];
                if (list.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="caps text-[10px] mb-2 flex items-center gap-3">
                      <span style={{ color: CATEGORY_ACCENT[cat] }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span style={{ color: 'var(--color-text)' }}>{cat.toUpperCase()}</span>
                      <span className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
                      <span className="font-mono text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                        {String(list.length).padStart(2, '0')}
                      </span>
                    </div>
                    <ul>
                      {list.map((ex, i) => (
                        <li key={ex.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(ex.id)}
                            className="w-full text-left h-12 px-2 flex items-center gap-3 press"
                            style={{
                              borderBottom: i < list.length - 1 ? '1px solid var(--color-line)' : undefined,
                            }}
                          >
                            <span
                              className="font-mono text-[10px] w-6"
                              style={{ color: 'var(--color-text-faint)' }}
                            >
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span
                              className="flex-1 text-[15px]"
                              style={{ color: 'var(--color-text)' }}
                            >
                              {ex.name}
                            </span>
                            <span
                              className="text-[11px]"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              →
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
