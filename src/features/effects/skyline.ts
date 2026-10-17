export interface Building {
  readonly x: number;
  readonly width: number;
  readonly height: number;
  readonly hasAntenna: boolean;
  readonly litWindows: readonly { x: number; y: number }[];
}

const WINDOW_SIZE = 4;
const WINDOW_GAP = 9;

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

export function generateSkyline(width: number, maxHeight: number, seed: number): Building[] {
  const random = seededRandom(seed);
  const buildings: Building[] = [];
  let cursor = 0;
  while (cursor < width) {
    const buildingWidth = 28 + Math.floor(random() * 70);
    const height = maxHeight * (0.3 + random() * 0.7);
    const litWindows: { x: number; y: number }[] = [];
    for (let wx = cursor + 6; wx < cursor + buildingWidth - WINDOW_SIZE - 4; wx += WINDOW_GAP) {
      for (let wy = maxHeight - height + 10; wy < maxHeight - 8; wy += WINDOW_GAP + 3) {
        if (random() > 0.72) litWindows.push({ x: wx, y: wy });
      }
    }
    buildings.push({ x: cursor, width: buildingWidth, height, hasAntenna: random() > 0.82, litWindows });
    cursor += buildingWidth + Math.floor(random() * 4);
  }
  return buildings;
}

export function skylineSvgMarkup(width: number, height: number, seed: number, className: string): string {
  const buildings = generateSkyline(width, height, seed);
  const blocks = buildings
    .map((b) => {
      const top = height - b.height;
      const antenna = b.hasAntenna ? `<rect x="${b.x + b.width / 2 - 1}" y="${top - 26}" width="2" height="26"/>` : '';
      return `<rect x="${b.x}" y="${top.toFixed(1)}" width="${b.width}" height="${b.height.toFixed(1)}"/>${antenna}`;
    })
    .join('');
  const windows = buildings
    .flatMap((b) => b.litWindows.map((w) => `<rect x="${w.x}" y="${w.y.toFixed(1)}" width="${WINDOW_SIZE}" height="${WINDOW_SIZE + 2}"/>`))
    .join('');
  return `<svg class="${className}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g class="skyline__blocks">${blocks}</g><g class="skyline__windows">${windows}</g></svg>`;
}
