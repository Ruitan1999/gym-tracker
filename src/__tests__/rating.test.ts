import { describe, it, expect } from 'vitest';
import { ratingColor, parseRating } from '../utils/rating';

describe('ratingColor', () => {
  it('runs cool to hot across the scale', () => {
    expect([1, 2, 3].map(ratingColor)).toEqual(Array(3).fill('var(--color-done)'));
    expect([4, 5, 6].map(ratingColor)).toEqual(Array(3).fill('var(--color-ember)'));
    expect([7, 8].map(ratingColor)).toEqual(Array(2).fill('var(--color-rust)'));
    expect([9, 10].map(ratingColor)).toEqual(Array(2).fill('var(--color-blood)'));
  });

  it('never uses the accent', () => {
    // The accent means "act on this". A rating is not an action, and tying the
    // two together is what broke the ramp when the accent moved to blue.
    for (let n = 1; n <= 10; n++) {
      expect(ratingColor(n)).not.toContain('volt');
    }
  });

  it('gives every step on the scale a colour', () => {
    for (let n = 1; n <= 10; n++) expect(ratingColor(n)).toBeTruthy();
  });

  it('has nothing to show for no rating', () => {
    expect(ratingColor(null)).toBeNull();
    expect(ratingColor(undefined)).toBeNull();
    expect(ratingColor(NaN)).toBeNull();
  });
});

describe('parseRating', () => {
  it('reads the rating off the front of the notes', () => {
    expect(parseRating('Rating: 7')).toBe(7);
    expect(parseRating('Rating: 10\nFelt strong')).toBe(10);
  });

  it('ignores notes that merely mention one', () => {
    expect(parseRating('Felt like a Rating: 9 session')).toBeNull();
  });

  it('copes with no notes at all', () => {
    expect(parseRating(undefined)).toBeNull();
    expect(parseRating(null)).toBeNull();
    expect(parseRating('')).toBeNull();
    expect(parseRating('Just a note')).toBeNull();
  });
});
