export interface RetryOptions {
  /** Сколько повторных попыток после первой. */
  retries?: number;
  /** Начальная задержка, мс. */
  delayMs?: number;
  /** Множитель экспоненциального роста задержки. */
  factor?: number;
  /** Верхняя граница задержки, мс. */
  maxDelayMs?: number;
  /** Full jitter: случайная задержка в диапазоне [0, delay], чтобы клиенты не ретраили синхронно. */
  jitter?: boolean;
  /** Решает, стоит ли повторять после ошибки (например, не ретраить 4xx). */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Прерывает ожидание и дальнейшие попытки. */
  signal?: AbortSignal;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function retry<T>(
  fn: (attempt: number) => Promise<T>,
  {
    retries = 3,
    delayMs = 100,
    factor = 2,
    maxDelayMs = 30_000,
    jitter = true,
    shouldRetry = () => true,
    signal,
  }: RetryOptions = {},
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    if (signal?.aborted) throw signal.reason;
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err, attempt)) throw err;
      const delay = Math.min(delayMs * factor ** attempt, maxDelayMs);
      await sleep(jitter ? Math.random() * delay : delay, signal);
    }
  }
}
