export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

export function circularOffset(index: number, active: number, length: number): number {
  if (length <= 0) return 0;
  const raw = wrapIndex(index - active, length);
  return raw > length / 2 ? raw - length : raw;
}

export function swipeDirection(deltaX: number, threshold: number): -1 | 0 | 1 {
  if (Math.abs(deltaX) < threshold) return 0;
  return deltaX < 0 ? 1 : -1;
}

export function formatCounter(index: number, length: number): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${pad(length === 0 ? 0 : index + 1)} / ${pad(length)}`;
}
