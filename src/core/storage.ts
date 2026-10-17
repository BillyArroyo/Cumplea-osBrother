const NAMESPACE = 'spidey-bday';

function namespacedKey(key: string): string {
  return `${NAMESPACE}:${key}`;
}

export function readJson<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
  try {
    const raw = window.localStorage.getItem(namespacedKey(key));
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch (error) {
    reportStorageError('read', key, error);
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(namespacedKey(key), JSON.stringify(value));
    return true;
  } catch (error) {
    reportStorageError('write', key, error);
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(namespacedKey(key));
  } catch (error) {
    reportStorageError('remove', key, error);
  }
}

function reportStorageError(operation: string, key: string, error: unknown): void {
  console.warn(`[storage] ${operation} failed for "${key}"`, error);
}
