import { describe, it, expect } from 'vitest';
import { calcEpley1RM } from '../store/staticData';

describe('staticData formulas', () => {
  describe('calcEpley1RM', () => {
    it('returns the weight itself if reps is 1', () => {
      expect(calcEpley1RM(100, 1)).toBe(100);
      expect(calcEpley1RM(85.5, 1)).toBe(85.5);
    });

    it('calculates 1RM correctly for multiple reps', () => {
      // 100kg for 5 reps -> 100 * (1 + 5/30) = 100 * (1 + 1/6) = 116.666... -> round(116.66... * 10) / 10 = 116.7
      expect(calcEpley1RM(100, 5)).toBe(116.7);
      
      // 80kg for 10 reps -> 80 * (1 + 10/30) = 80 * 1.333... = 106.66... -> 106.7
      expect(calcEpley1RM(80, 10)).toBe(106.7);
    });

    it('handles floating point weights', () => {
      // 92.5kg for 3 reps -> 92.5 * (1 + 3/30) = 92.5 * 1.1 = 101.75 -> round(1017.5) / 10 = 101.8
      expect(calcEpley1RM(92.5, 3)).toBe(101.8);
    });
  });
});
