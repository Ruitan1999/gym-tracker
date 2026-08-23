import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';

import { imageForExercise, MEDIA_ATTRIBUTION } from '../../utils/exerciseImage';
import ExerciseThumb from './ExerciseThumb';
import { BODY_PART_ORDER, BODY_PART_CODE, BODY_PART_ACCENT } from '../../utils/bodyParts';

interface ExerciseSelectProps {
  onSelect: (exerciseId: string) => void;
  onClose: () => void;
  /** Sheet heading — the picker serves both a session and a template. */
  title?: string;
  /** Exercises already in the target; shown as added, and tapping toggles them. */
  addedIds?: string[];
  /**
   * Whether the sheet owns a history entry of its own so Back closes it. Turn
   * this off where the sheet is the whole point of the route it sits on — there,
   * Back should unwind the route itself rather than uncover an empty page.
   */
  manageHistory?: boolean;
}

export default function ExerciseSelect({
  onSelect,
  onClose,
  title = 'Add to session',
  addedIds,
  manageHistory = true,
}: ExerciseSelectProps) {
  const { appData, addExercise, exerciseImages } = useAppContext();
  const added = useMemo(() => new Set(addedIds ?? []), [addedIds]);
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
    let hasPushed = false;
    if (manageHistory) {
      window.history.pushState({ modal: 'exercise-select' }, '');
      hasPushed = true;
    }

    const onPop = () => {
      hasPushed = false;
      if (closedRef.current) return;
      closedRef.current = true;
      onClose();
    };
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !closedRef.current) {
        closedRef.current = true;
        onClose();
      }
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKeydown);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKeydown);
      if (hasPushed) {
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

  const isSearching = filter.length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const lower = filter.toLowerCase();
    return appData.exercises.filter((e) => e.name.toLowerCase().includes(lower));
  }, [appData.exercises, filter, isSearching]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, typeof appData.exercises> = {};
    for (const cat of BODY_PART_ORDER) {
      groups[cat] = appData.exercises.filter((e) => e.bodyPart === cat);
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
              {title}
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
              borderRadius: 'var(--radius)',
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
                        background: 'var(--color-volt-tint)',
                        border: '1.5px dashed var(--color-volt)',
                        borderRadius: 'var(--radius)',
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
                        {BODY_PART_ORDER.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              const newExercise = {
                                id: crypto.randomUUID(),
                                name: choosingCategoryFor,
                                bodyPart: cat,
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
                              border: `1px solid ${BODY_PART_ACCENT[cat]}`,
                              borderRadius: 'var(--radius)',
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
                                color: BODY_PART_ACCENT[cat],
                                border: `1px solid ${BODY_PART_ACCENT[cat]}`,
                                borderRadius: 'var(--radius)',
                              }}
                            >
                              {BODY_PART_CODE[cat]}
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
                        <PickerThumb id={ex.id} images={exerciseImages} />
                        <span
                          className="flex-1 text-[15px]"
                          style={{ color: 'var(--color-text)', fontWeight: 500 }}
                        >
                          {ex.name}
                        </span>
                        {added.has(ex.id) ? (
                          <AddedTag />
                        ) : (
                          <span
                            className="caps-tight text-[9px] px-2 py-0.5"
                            style={{
                              color: BODY_PART_ACCENT[ex.bodyPart],
                              border: `1px solid ${BODY_PART_ACCENT[ex.bodyPart]}`,
                              borderRadius: 'var(--radius)',
                            }}
                          >
                            {BODY_PART_CODE[ex.bodyPart]}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {BODY_PART_ORDER.map((cat, idx) => {
                const list = groupedByCategory[cat];
                if (list.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="caps text-[10px] mb-2 flex items-center gap-3">
                      <span style={{ color: BODY_PART_ACCENT[cat] }}>
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
                            <PickerThumb id={ex.id} images={exerciseImages} />
                            <span
                              className="flex-1 text-[15px]"
                              style={{ color: 'var(--color-text)' }}
                            >
                              {ex.name}
                            </span>
                            {added.has(ex.id) ? (
                              <AddedTag />
                            ) : (
                              <span
                                className="text-[11px]"
                                style={{ color: 'var(--color-text-muted)' }}
                              >
                                →
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
          {/* Required wherever the exercise images are shown. */}
          <p
            className="caps-tight text-[9px] pt-5 pb-1 text-center"
            style={{ color: 'var(--color-text-faint)' }}
          >
            {MEDIA_ATTRIBUTION}
          </p>
        </div>
      </div>
    </>
  );
}

const THUMB = 40;

/**
 * Keeps its slot whether or not there is a picture, so a list mixing the two
 * doesn't go ragged down the left edge. Lazy, because a category can run to
 * several hundred rows.
 */
function PickerThumb({ id, images }: { id: string; images: Record<string, string> }) {
  return <ExerciseThumb src={imageForExercise(id, images)} size={THUMB} />;
}

function AddedTag() {
  return (
    <span
      className="caps-tight text-[9px] px-2 py-0.5 flex items-center gap-1"
      style={{
        color: 'var(--color-done-deep)',
        background: 'var(--color-done-tint)',
        border: '1px solid var(--color-done)',
        borderRadius: 'var(--radius)',
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square" className="w-2.5 h-2.5">
        <path d="M4 12l5 5L20 6" />
      </svg>
      ADDED
    </span>
  );
}
