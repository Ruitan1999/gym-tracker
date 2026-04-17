import { describe, it, expect } from 'vitest';
import { kgToLb, lbToKg } from '../utils/conversions';

describe('conversions', () => {
  describe('kgToLb', () => {
    it('converts 100 kg to approximately 220.46 lb', () => {
      expect(kgToLb(100)).toBeCloseTo(220.46, 1);
    });

    it('converts 0 kg to 0 lb', () => {
      expect(kgToLb(0)).toBe(0);
    });
  });

  describe('lbToKg', () => {
    it('converts 220.46 lb to approximately 100 kg', () => {
      expect(lbToKg(220.46)).toBeCloseTo(100, 1);
    });

    it('converts 0 lb to 0 kg', () => {
      expect(lbToKg(0)).toBe(0);
    });
  });

  describe('round-trip', () => {
    it('lbToKg(kgToLb(x)) is approximately x', () => {
      const values = [0, 1, 50, 100, 200.5];
      for (const x of values) {
        expect(lbToKg(kgToLb(x))).toBeCloseTo(x, 1);
      }
    });
  });
});
