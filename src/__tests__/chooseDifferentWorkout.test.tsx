import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import NextUpCard from '../components/workout/NextUpCard';
import { TEMPLATE_LIST_ID } from '../utils/templateList';

const STORAGE_KEY = 'gym-tracker-data';
// A Thursday: index 3.
const THURSDAY = new Date('2026-08-27T09:00:00');

const group = (id: string, days?: number[]) => ({
  id,
  name: id,
  exerciseIds: ['a'],
  createdAt: '2026-01-01T00:00:00Z',
  ...(days ? { days } : {}),
});

function seed(groups: ReturnType<typeof group>[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      exercises: [{ id: 'a', name: 'Bench Press', bodyPart: 'chest', isCustom: true }],
      workouts: [],
      groups,
      dataVersion: 1,
    }),
  );
}

function renderCard() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <div id={TEMPLATE_LIST_ID} data-testid="list" />
        <NextUpCard />
      </AppProvider>
    </MemoryRouter>,
  );
}

const LINK = /choose a different workout/i;

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(THURSDAY);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Choose a different workout', () => {
  it('is hidden when the only template is the suggested one', () => {
    seed([group('push', [3])]);
    renderCard();
    expect(screen.queryByText(LINK)).toBeNull();
  });

  it('shows under a due suggestion when another template exists', () => {
    seed([group('push', [3]), group('pull', [5])]);
    renderCard();
    expect(screen.getByText(LINK)).toBeTruthy();
  });

  it('shows under a rest-day suggestion too', () => {
    seed([group('push', [5]), group('pull', [6])]);
    renderCard();
    expect(screen.getByText(LINK)).toBeTruthy();
  });

  it('scrolls the template list into view and changes nothing else', () => {
    seed([group('push', [3]), group('pull', [5])]);
    const scroll = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scroll;
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as never;
    renderCard();
    const before = localStorage.getItem(STORAGE_KEY);
    const keysBefore = Object.keys(localStorage).sort();
    fireEvent.click(screen.getByText(LINK));
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(scroll.mock.contexts[0]).toBe(screen.getByTestId('list'));
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
    expect(Object.keys(localStorage).sort()).toEqual(keysBefore);
  });

  it('jumps without animation when reduced motion is on', () => {
    seed([group('push', [3]), group('pull', [5])]);
    const scroll = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scroll;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as never;
    renderCard();
    fireEvent.click(screen.getByText(LINK));
    expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('is a 44px target', () => {
    seed([group('push', [3]), group('pull', [5])]);
    renderCard();
    expect(screen.getByText(LINK).closest('button')!.className).toContain('h-11');
  });
});
