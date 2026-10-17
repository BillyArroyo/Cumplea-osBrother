export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface WebShape {
  readonly spokes: readonly (readonly [Point, Point])[];
  readonly rings: readonly (readonly Point[])[];
}

export function buildWeb(center: Point, radius: number, spokeCount: number, ringCount: number, startAngle = 0, sweep = Math.PI * 2): WebShape {
  const isFullCircle = sweep >= Math.PI * 2 - 1e-6;
  const spokeTotal = isFullCircle ? spokeCount : spokeCount + 1;
  const angles = Array.from({ length: spokeTotal }, (_, i) => startAngle + (sweep * i) / spokeCount);
  const pointAt = (angle: number, distance: number): Point => ({
    x: center.x + Math.cos(angle) * distance,
    y: center.y + Math.sin(angle) * distance,
  });

  const spokes = angles.map((angle) => [center, pointAt(angle, radius)] as const);
  const rings = Array.from({ length: ringCount }, (_, ring) => {
    const distance = (radius * (ring + 1)) / ringCount;
    const points = angles.map((angle) => pointAt(angle, distance));
    return isFullCircle && points[0] ? [...points, points[0]] : points;
  });

  return { spokes, rings };
}

export function sagPath(points: readonly Point[], center: Point, sag: number): string {
  const [first, ...rest] = points;
  if (!first) return '';
  let previous = first;
  const segments = rest.map((point) => {
    const midX = (previous.x + point.x) / 2;
    const midY = (previous.y + point.y) / 2;
    const controlX = midX + (center.x - midX) * sag;
    const controlY = midY + (center.y - midY) * sag;
    previous = point;
    return `Q${controlX.toFixed(1)} ${controlY.toFixed(1)} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  });
  return `M${first.x.toFixed(1)} ${first.y.toFixed(1)} ${segments.join(' ')}`;
}

export function webSvgMarkup(size: number, corner: 'tl' | 'tr' | 'bl' | 'br', className: string): string {
  const origins: Record<typeof corner, { center: Point; start: number }> = {
    tl: { center: { x: 0, y: 0 }, start: 0 },
    tr: { center: { x: size, y: 0 }, start: Math.PI / 2 },
    br: { center: { x: size, y: size }, start: Math.PI },
    bl: { center: { x: 0, y: size }, start: Math.PI * 1.5 },
  };
  const { center, start } = origins[corner];
  const web = buildWeb(center, size, 7, 7, start, Math.PI / 2);
  const spokes = web.spokes
    .map(([from, to]) => `M${from.x} ${from.y} L${to.x.toFixed(1)} ${to.y.toFixed(1)}`)
    .join(' ');
  const rings = web.rings.map((ring) => sagPath(ring, center, 0.12)).join(' ');
  return `<svg class="${className}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><path d="${spokes} ${rings}" fill="none" stroke="currentColor" stroke-linecap="round"/></svg>`;
}
