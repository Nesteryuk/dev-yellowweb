import '@testing-library/jest-dom/vitest';

// Новые версии Node объявляют глобальный localStorage, который перекрывает jsdom
// и недоступен без --localstorage-file, поэтому подставляем in-memory реализацию.
if (typeof window.localStorage?.clear !== 'function') {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => store.get(k) ?? null,
    key: (i) => [...store.keys()][i] ?? null,
    removeItem: (k) => void store.delete(k),
    setItem: (k, v) => void store.set(k, String(v)),
  };
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
}
