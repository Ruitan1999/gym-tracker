import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useAppContext } from '../context/AppContext';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

const MINE = { id: 'mine-1', name: 'Sandbag Carry', bodyPart: 'core', isCustom: true } as const;

describe('updateCustomExercise', () => {
  beforeEach(() => localStorage.clear());

  it('refiles one of your own', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => result.current.addExercise({ ...MINE }));
    act(() => result.current.updateCustomExercise('mine-1', { bodyPart: 'legs' }));

    expect(result.current.appData.exercises.find((e) => e.id === 'mine-1')?.bodyPart).toBe('legs');
  });

  it('sets a picture, and shows it through the merged map', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => result.current.addExercise({ ...MINE }));
    act(() => result.current.updateCustomExercise('mine-1', { image: 'https://cdn/a.jpg' }));

    expect(result.current.appData.exerciseImages).toEqual({ 'mine-1': 'https://cdn/a.jpg' });
    expect(result.current.exerciseImages['mine-1']).toBe('https://cdn/a.jpg');
  });

  it('clears a picture when asked, without touching the body part', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => result.current.addExercise({ ...MINE }));
    act(() => result.current.updateCustomExercise('mine-1', { image: 'https://cdn/a.jpg' }));
    act(() => result.current.updateCustomExercise('mine-1', { image: null }));

    expect(result.current.appData.exerciseImages).toEqual({});
    expect(result.current.appData.exercises.find((e) => e.id === 'mine-1')?.bodyPart).toBe('core');
  });

  it('leaves a shipped exercise alone', () => {
    // Its body part comes back from the library on every load, so accepting a
    // change here would look like it worked and then silently undo itself.
    const { result } = renderHook(() => useAppContext(), { wrapper });
    const before = result.current.appData.exercises.find((e) => e.id === 'ex-push-001')!.bodyPart;

    act(() => result.current.updateCustomExercise('ex-push-001', { bodyPart: 'calves' }));

    expect(result.current.appData.exercises.find((e) => e.id === 'ex-push-001')?.bodyPart).toBe(
      before,
    );
    expect(result.current.appData.exerciseImages ?? {}).toEqual({});
  });

  it('does nothing for an id that is not there', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => result.current.updateCustomExercise('nope', { bodyPart: 'legs' }));

    expect(result.current.appData.exerciseImages ?? {}).toEqual({});
  });

  it('drops the picture when the exercise is deleted', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => result.current.addExercise({ ...MINE }));
    act(() => result.current.updateCustomExercise('mine-1', { image: 'https://cdn/a.jpg' }));
    act(() => {
      result.current.deleteExercise('mine-1');
    });

    expect(result.current.appData.exerciseImages).toEqual({});
  });
});

describe('the pictures a screen should draw', () => {
  it('lets the owner\'s own win over an admin-set one for the same exercise', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => result.current.addExercise({ ...MINE }));
    act(() => result.current.updateCustomExercise('mine-1', { image: 'https://cdn/mine.jpg' }));

    // libraryImages is the admin layer and stays untouched by anything here.
    expect(result.current.libraryImages['mine-1']).toBeUndefined();
    expect(result.current.exerciseImages['mine-1']).toBe('https://cdn/mine.jpg');
  });
});
