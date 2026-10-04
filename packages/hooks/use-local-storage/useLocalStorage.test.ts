import { act, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => window.localStorage.clear());

  it('returns the initial value and persists updates', () => {
    const { result } = renderHook(() => useLocalStorage('k', 1));
    expect(result.current[0]).toBe(1);
    act(() => result.current[1]((n) => n + 1));
    expect(result.current[0]).toBe(2);
    expect(window.localStorage.getItem('k')).toBe('2');
  });

  it('applies consecutive functional updates against the latest value', () => {
    const { result } = renderHook(() => useLocalStorage('k', 0));
    act(() => {
      result.current[1]((n) => n + 1);
      result.current[1]((n) => n + 1);
    });
    expect(result.current[0]).toBe(2);
  });

  it('reads an existing value and falls back on invalid JSON', () => {
    window.localStorage.setItem('k', JSON.stringify('stored'));
    expect(renderHook(() => useLocalStorage('k', 'initial')).result.current[0]).toBe('stored');
    window.localStorage.setItem('bad', '{oops');
    expect(renderHook(() => useLocalStorage('bad', 'initial')).result.current[0]).toBe('initial');
  });

  it('re-reads the value when the key changes', () => {
    window.localStorage.setItem('a', '"A"');
    window.localStorage.setItem('b', '"B"');
    const { result, rerender } = renderHook(({ k }) => useLocalStorage(k, ''), {
      initialProps: { k: 'a' },
    });
    expect(result.current[0]).toBe('A');
    rerender({ k: 'b' });
    expect(result.current[0]).toBe('B');
  });

  it('syncs when another tab changes the value', () => {
    const { result } = renderHook(() => useLocalStorage('k', 'x'));
    act(() => {
      window.localStorage.setItem('k', '"from-other-tab"');
      window.dispatchEvent(new StorageEvent('storage', { key: 'k' }));
    });
    expect(result.current[0]).toBe('from-other-tab');
  });

  it('syncs two hooks in the same tab and supports remove', () => {
    const a = renderHook(() => useLocalStorage('k', 0));
    const b = renderHook(() => useLocalStorage('k', 0));
    act(() => a.result.current[1](5));
    expect(b.result.current[0]).toBe(5);
    act(() => b.result.current[2]());
    expect(a.result.current[0]).toBe(0);
    expect(window.localStorage.getItem('k')).toBeNull();
  });

  it('renders the initial value on the server', () => {
    function Probe() {
      return createElement('span', null, String(useLocalStorage('k', 'ssr')[0]));
    }
    window.localStorage.setItem('k', '"client"');
    expect(renderToString(createElement(Probe))).toContain('ssr');
  });
});
