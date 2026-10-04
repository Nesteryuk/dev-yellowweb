# retry

Повтор асинхронной операции с экспоненциальной задержкой, full jitter, верхней границей задержки, предикатом `shouldRetry` и отменой через `AbortSignal`.

```ts
import { retry } from '@yellowweb/utils-ts';

const data = await retry(() => fetchJson(url), {
  retries: 4,
  delayMs: 200,
  maxDelayMs: 5_000,
  shouldRetry: (err) => !(err instanceof HttpError && err.status < 500),
  signal: controller.signal,
});
```

Если попытки исчерпаны, пробрасывается последняя ошибка; при отмене — `signal.reason`.
