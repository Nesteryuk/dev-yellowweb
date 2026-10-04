export interface DebounceOptions {
  /** Вызвать функцию сразу по первому вызову серии. */
  leading?: boolean;
  /** Вызвать функцию после паузы `wait` с аргументами последнего вызова. */
  trailing?: boolean;
  /** Максимум, сколько можно откладывать вызов при непрерывном потоке вызовов, мс. */
  maxWait?: number;
}

export interface Debounced<A extends unknown[], R> {
  (...args: A): R | undefined;
  /** Отбросить отложенный вызов и сбросить состояние. */
  cancel(): void;
  /** Выполнить отложенный вызов немедленно (если он есть) и вернуть результат. */
  flush(): R | undefined;
  /** Есть ли отложенный (trailing) вызов. */
  pending(): boolean;
}

/**
 * Откладывает вызов `fn` до паузы в `wait` мс после последнего вызова.
 *
 * Почему своя реализация, а не lodash:
 *  - ноль зависимостей: пакет остаётся «чистым» и не раздувает бандл;
 *  - строгая типизация аргументов и результата (`Debounced<A, R>`);
 *  - один механизм (`maxWait`) покрывает и debounce, и throttle — см. `throttle`.
 *
 * Время берём из `Date.now()`, а не считаем таймерами «в уме»: таймеры в браузере
 * могут срабатывать с опозданием (фоновая вкладка), а метки времени дают
 * корректное решение «пора вызывать или нет» при любой задержке.
 */
export function debounce<A extends unknown[], R>(
  fn: (...args: A) => R,
  wait: number,
  options: DebounceOptions = {},
): Debounced<A, R> {
  // Валидируем сразу: ошибка при создании лучше, чем «тихо не работает» в рантайме.
  if (!Number.isFinite(wait) || wait < 0) {
    throw new RangeError(`debounce: wait должен быть конечным числом >= 0, получено ${wait}`);
  }
  const { leading = false, trailing = true } = options;
  if (!leading && !trailing) {
    throw new TypeError(
      'debounce: нужен хотя бы один из флагов leading/trailing, иначе fn не вызовется никогда',
    );
  }
  const maxing = options.maxWait !== undefined;
  if (maxing && !Number.isFinite(options.maxWait)) {
    throw new RangeError(
      `debounce: maxWait должен быть конечным числом, получено ${options.maxWait}`,
    );
  }
  // maxWait меньше wait не имеет смысла: серия закончится раньше, чем сработает лимит.
  const maxWait = maxing ? Math.max(options.maxWait as number, wait) : 0;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: A | undefined;
  let lastThis: unknown;
  let result: R | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;

  const invoke = (time: number): R => {
    const args = lastArgs as A;
    const context = lastThis;
    // Очищаем до вызова fn: если fn бросит исключение, одни и те же аргументы не выполнятся повторно.
    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    result = fn.apply(context, args);
    return result;
  };

  const remainingWait = (time: number): number => {
    const waitLeft = wait - (time - (lastCallTime as number));
    return maxing ? Math.min(waitLeft, maxWait - (time - lastInvokeTime)) : waitLeft;
  };

  const shouldInvoke = (time: number): boolean =>
    lastCallTime === undefined ||
    time - lastCallTime >= wait ||
    // Часы системы могли «откатиться назад» — считаем это новой серией, а не зависаем.
    time - lastCallTime < 0 ||
    (maxing && time - lastInvokeTime >= maxWait);

  const startTimer = (delay: number) => {
    timer = setTimeout(timerExpired, delay);
  };

  const trailingEdge = (time: number): R | undefined => {
    timer = undefined;
    if (trailing && lastArgs) return invoke(time);
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  };

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      trailingEdge(time);
      return;
    }
    // Таймер сработал раньше времени (были новые вызовы) — досчитываем остаток.
    startTimer(Math.max(0, remainingWait(time)));
  }

  const leadingEdge = (time: number): R | undefined => {
    // Точка отсчёта окна maxWait — начало серии, даже если вызова сразу нет.
    lastInvokeTime = time;
    startTimer(wait);
    return leading ? invoke(time) : result;
  };

  function debounced(this: unknown, ...args: A): R | undefined {
    const time = Date.now();
    const invoking = shouldInvoke(time);
    lastArgs = args;
    // Сохраняем this осознанно: отложенный вызов должен выполниться в контексте исходного вызова.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastThis = this;
    lastCallTime = time;

    if (invoking) {
      if (timer === undefined) return leadingEdge(time);
      if (maxing) {
        // Поток вызовов не прекращается дольше maxWait — вызываем принудительно,
        // иначе debounce мог бы откладывать вызов бесконечно.
        clearTimeout(timer);
        startTimer(wait);
        return invoke(time);
      }
    }
    if (timer === undefined) startTimer(wait);
    return result;
  }

  return Object.assign(debounced, {
    cancel() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      lastArgs = undefined;
      lastThis = undefined;
      lastCallTime = undefined;
      lastInvokeTime = 0;
    },
    flush(): R | undefined {
      if (timer === undefined) return result;
      clearTimeout(timer);
      return trailingEdge(Date.now());
    },
    pending(): boolean {
      return timer !== undefined && trailing && lastArgs !== undefined;
    },
  });
}
