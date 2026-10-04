import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  // `storage` приходит из других вкладок; в текущей вкладке уведомляем вручную.
  window.addEventListener('storage', callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', callback);
  };
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Состояние, синхронизированное с localStorage.
 * SSR-безопасно (на сервере и при гидратации — `initial`), реагирует на смену `key`
 * и на изменения из других вкладок.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const initialRef = useRef(initial);
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );
  const value = useMemo(() => parse(raw, initialRef.current), [raw]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = parse(readRaw(key), initialRef.current);
      const resolved = next instanceof Function ? next(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // storage недоступен или переполнен — состояние не сохраняется
        return;
      }
      listeners.forEach((l) => l());
    },
    [key],
  );

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      return;
    }
    listeners.forEach((l) => l());
  }, [key]);

  return [value, set, remove] as const;
}
