import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const prefetched: string[] = [];
vi.mock('../utils/prefetchImages', async (orig) => ({
  ...(await orig<typeof import('../utils/prefetchImages')>()),
  prefetchImages: (urls: (string | undefined)[]) => {
    prefetched.push(...(urls.filter(Boolean) as string[]));
    return () => {};
  },
}));

import { AppProvider } from '../context/AppContext';
import NextUpCard from '../components/workout/NextUpCard';
import { imageForExercise } from '../utils/exerciseImage';

// A Thursday: index 3.
const THURSDAY = new Date('2026-08-27T09:00:00');

beforeEach(() => {
  localStorage.clear();
  prefetched.length = 0;
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(THURSDAY);
  localStorage.setItem(
    'gym-tracker-data',
    JSON.stringify({
      workouts: [],
      groups: [
        { id: 'due', name: 'Due', exerciseIds: ['ex-push-001'], createdAt: '2026-01-01T00:00:00Z', days: [3] },
        { id: 'later', name: 'Later', exerciseIds: ['ex-pull-001'], createdAt: '2026-01-01T00:00:00Z', days: [5] },
      ],
      dataVersion: 1,
    }),
  );
});
afterEach(() => vi.useRealTimers());

describe('Next Up prefetch', () => {
  it('fetches the pictures of what it offers, and not every template', () => {
    // The app warms every template's pictures once at startup; the card must
    // add only what it offers on top of that.
    const count = (url: string | null) => prefetched.filter((u) => u === url).length;
    render(
      <MemoryRouter>
        <AppProvider>
          <NextUpCard />
        </AppProvider>
      </MemoryRouter>,
    );
    const due = imageForExercise('ex-push-001', {});
    const later = imageForExercise('ex-pull-001', {});
    expect(due).toBeTruthy();
    expect(count(due)).toBeGreaterThan(count(later));
  });
});
