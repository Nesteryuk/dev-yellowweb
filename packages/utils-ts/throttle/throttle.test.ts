import { throttle } from './throttle';

describe('throttle', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('по умолчанию: первый вызов сразу, последний — в конце окна', () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t('a');
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(50);
    t('b');
    vi.advanceTimersByTime(49);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('b');
  });

  it('не вызывает fn чаще, чем раз в wait, при непрерывном потоке вызовов', () => {
    const times: number[] = [];
    const t = throttle(() => times.push(Date.now()), 100);
    for (let i = 0; i < 100; i++) {
      t();
      vi.advanceTimersByTime(10);
    }
    vi.advanceTimersByTime(200);
    expect(times.length).toBeGreaterThanOrEqual(8);
    for (let i = 1; i < times.length; i++) {
      expect(times[i] - times[i - 1]).toBeGreaterThanOrEqual(100);
    }
  });

  it('вызов вскоре после trailing не обходит ограничение окна', () => {
    const times: number[] = [];
    const t = throttle(() => times.push(Date.now()), 100);
    t(); // 0 — leading
    vi.advanceTimersByTime(50);
    t(); // 50 — trailing в 100
    vi.advanceTimersByTime(60); // 110
    t();
    vi.advanceTimersByTime(300);
    for (let i = 1; i < times.length; i++) {
      expect(times[i] - times[i - 1]).toBeGreaterThanOrEqual(100);
    }
  });

  it('trailing: false — вызовы внутри окна отбрасываются', () => {
    const fn = vi.fn();
    const t = throttle(fn, 100, { trailing: false });
    t('a');
    vi.advanceTimersByTime(50);
    t('b');
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('leading: false — первый вызов откладывается до конца окна', () => {
    const fn = vi.fn();
    const t = throttle(fn, 100, { leading: false });
    t('a');
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('cancel и flush работают как у debounce', () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t('a');
    t('b');
    expect(t.pending()).toBe(true);
    t.flush();
    expect(fn).toHaveBeenLastCalledWith('b');
    t('c');
    t.cancel();
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
