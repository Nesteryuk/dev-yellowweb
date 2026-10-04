import { retry } from './retry';

describe('retry', () => {
  afterEach(() => vi.useRealTimers());

  it('resolves after transient failures', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue('ok');
    await expect(retry(fn, { delayMs: 1 })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(1);
  });

  it('throws the last error when retries are exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(retry(fn, { retries: 2, delayMs: 1 })).rejects.toThrow('boom');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry when shouldRetry returns false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('4xx'));
    await expect(retry(fn, { shouldRetry: () => false })).rejects.toThrow('4xx');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('uses exponential backoff capped by maxDelayMs (no jitter)', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValue(new Error('x'));
    const p = retry(fn, { retries: 3, delayMs: 100, factor: 10, maxDelayMs: 500, jitter: false });
    p.catch(() => {});
    await vi.advanceTimersByTimeAsync(99);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1); // 100 мс
    expect(fn).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(500); // 1000 -> срезано до 500
    expect(fn).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(500);
    expect(fn).toHaveBeenCalledTimes(4);
    await expect(p).rejects.toThrow('x');
  });

  it('applies full jitter within [0, delay]', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const fn = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue('ok');
    const p = retry(fn, { delayMs: 100 });
    await vi.advanceTimersByTimeAsync(49);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await expect(p).resolves.toBe('ok');
    vi.restoreAllMocks();
  });

  it('aborts while waiting', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const fn = vi.fn().mockRejectedValue(new Error('x'));
    const p = retry(fn, { delayMs: 1000, jitter: false, signal: controller.signal });
    p.catch(() => {});
    await vi.advanceTimersByTimeAsync(10);
    controller.abort(new Error('aborted'));
    await expect(p).rejects.toThrow('aborted');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not call fn when the signal is already aborted', async () => {
    const fn = vi.fn();
    const controller = new AbortController();
    controller.abort(new Error('nope'));
    await expect(retry(fn, { signal: controller.signal })).rejects.toThrow('nope');
    expect(fn).not.toHaveBeenCalled();
  });
});
