export type ThemeMode = 'hero' | 'venom';

interface AppEvents {
  'theme:change': ThemeMode;
  'music:toggle': boolean;
  'celebrate': void;
  'voice:state': boolean;
}

type Listener<T> = (payload: T) => void;

const listeners = new Map<keyof AppEvents, Set<Listener<never>>>();

export function on<K extends keyof AppEvents>(event: K, listener: Listener<AppEvents[K]>): () => void {
  const bucket = listeners.get(event) ?? new Set();
  bucket.add(listener as Listener<never>);
  listeners.set(event, bucket);
  return () => bucket.delete(listener as Listener<never>);
}

export function emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): void {
  listeners.get(event)?.forEach((listener) => (listener as Listener<AppEvents[K]>)(payload));
}
