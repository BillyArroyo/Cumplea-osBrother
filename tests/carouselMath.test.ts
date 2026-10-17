import { describe, expect, it } from 'vitest';
import { circularOffset, formatCounter, swipeDirection, wrapIndex } from '../src/features/carousel/carouselMath';

describe('wrapIndex', () => {
  it('wraps negative indexes to the end', () => {
    expect(wrapIndex(-1, 5)).toBe(4);
  });

  it('wraps overflow to the start', () => {
    expect(wrapIndex(5, 5)).toBe(0);
  });

  it('returns 0 for empty collections', () => {
    expect(wrapIndex(3, 0)).toBe(0);
  });
});

describe('circularOffset', () => {
  it('takes the shortest path around the ring', () => {
    expect(circularOffset(0, 4, 5)).toBe(1);
    expect(circularOffset(4, 0, 5)).toBe(-1);
    expect(circularOffset(2, 2, 5)).toBe(0);
  });
});

describe('swipeDirection', () => {
  it('ignores small drags', () => {
    expect(swipeDirection(20, 45)).toBe(0);
  });

  it('advances when dragging left and goes back when dragging right', () => {
    expect(swipeDirection(-80, 45)).toBe(1);
    expect(swipeDirection(80, 45)).toBe(-1);
  });
});

describe('formatCounter', () => {
  it('pads numbers to two digits', () => {
    expect(formatCounter(2, 12)).toBe('03 / 12');
  });

  it('shows zero when there are no slides', () => {
    expect(formatCounter(0, 0)).toBe('00 / 00');
  });
});
