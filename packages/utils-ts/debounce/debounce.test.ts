import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('вызывает fn один раз с аргументами последнего вызова после паузы', () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d(1);
    d(2);
    d(3);
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it('каждый новый вызов сдвигает срабатывание', () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d();
    vi.advanceTimersByTime(60);
    d();
    vi.advanceTimersByTime(60);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(40);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('leading: вызывает сразу и не дублирует единственный вызов в конце', () => {
    const fn = vi.fn();
    const d = debounce(fn, 100, { leading: true });
    d('a');
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('leading + trailing: повторный вызов в окне даёт второй вызов в конце', () => {
    const fn = vi.fn();
    const d = debounce(fn, 100, { leading: true });
    d('a');
    d('b');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('b');
  });

  it('leading без trailing: вызовы внутри окна игнорируются', () => {
    const fn = vi.fn();
    const d = debounce(fn, 100, { leading: true, trailing: false });
    d('a');
    d('b');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
    d('c'); // новое окно
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('maxWait: при непрерывных вызовах fn всё равно срабатывает с последними аргументами', () => {
    const fn = vi.fn();
    const d = debounce(fn, 100, { maxWait: 250 });
    // Вызовы каждые 50 мс — пауза в 100 мс никогда не наступает, обычный debounce молчал бы вечно.
    for (let t = 0; t < 250; t += 50) {
      d(t);
      vi.advanceTimersByTime(t === 200 ? 49 : 50);
    }
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); // ровно 250 мс с начала серии
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(200);
  });

  it('cancel отбрасывает отложенный вызов', () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d();
    expect(d.pending()).toBe(true);
    d.cancel();
    expect(d.pending()).toBe(false);
    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });

  it('flush выполняет отложенный вызов сразу и возвращает результат', () => {
    const fn = vi.fn((x: number) => x * 2);
    const d = debounce(fn, 100);
    d(21);
    expect(d.flush()).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(d.pending()).toBe(false);
  });

  it('flush без отложенного вызова возвращает последний результат и ничего не вызывает', () => {
    const fn = vi.fn(() => 'r');
    const d = debounce(fn, 100);
    expect(d.flush()).toBeUndefined();
    d();
    vi.advanceTimersByTime(100);
    expect(d.flush()).toBe('r');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('возвращает результат последнего выполненного вызова и сохраняет this', () => {
    const obj = {
      n: 7,
      get(this: { n: number }) {
        return this.n;
      },
    };
    const d = debounce(obj.get, 50, { leading: true });
    expect(d.call(obj)).toBe(7);
  });

  it('исключение в fn не приводит к повторному выполнению тех же аргументов', () => {
    const fn = vi.fn(() => {
      throw new Error('boom');
    });
    const d = debounce(fn, 100, { leading: true });
    expect(() => d()).toThrow('boom');
    d.cancel();
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('после cancel новая серия начинается с чистого состояния', () => {
    const fn = vi.fn();
    const d = debounce(fn, 100, { leading: true });
    d('a');
    d.cancel();
    d('b');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('валидирует параметры', () => {
    expect(() => debounce(() => {}, -1)).toThrow(RangeError);
    expect(() => debounce(() => {}, NaN)).toThrow(RangeError);
    expect(() => debounce(() => {}, 10, { maxWait: Infinity })).toThrow(RangeError);
    expect(() => debounce(() => {}, 10, { leading: false, trailing: false })).toThrow(TypeError);
  });
});
