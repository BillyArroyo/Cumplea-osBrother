import { describe, expect, it } from 'vitest';
import { generateSkyline, seededRandom } from '../src/features/effects/skyline';
import { buildWeb } from '../src/features/effects/webGeometry';

describe('buildWeb', () => {
  it('closes rings on a full circle web', () => {
    const web = buildWeb({ x: 0, y: 0 }, 100, 8, 3);
    expect(web.spokes).toHaveLength(8);
    expect(web.rings).toHaveLength(3);
    expect(web.rings[0]).toHaveLength(9);
  });

  it('adds an extra spoke to close a partial sweep', () => {
    const web = buildWeb({ x: 0, y: 0 }, 100, 6, 2, 0, Math.PI / 2);
    expect(web.spokes).toHaveLength(7);
  });
});

describe('skyline', () => {
  it('is deterministic for the same seed', () => {
    expect(generateSkyline(800, 200, 42)).toEqual(generateSkyline(800, 200, 42));
  });

  it('covers the full width', () => {
    const buildings = generateSkyline(800, 200, 7);
    const last = buildings[buildings.length - 1]!;
    expect(last.x + last.width).toBeGreaterThanOrEqual(800);
  });

  it('produces values in [0, 1)', () => {
    const random = seededRandom(1);
    Array.from({ length: 100 }, random).forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });
});
