import { debounce, type Debounced } from '../debounce/debounce';

export interface ThrottleOptions {
  /** Вызвать сразу по первому вызову окна (по умолчанию true). */
  leading?: boolean;
  /** Вызвать в конце окна с последними аргументами (по умолчанию true). */
  trailing?: boolean;
}

/**
 * Не чаще одного вызова `fn` в `wait` мс.
 *
 * Почему это просто debounce с `maxWait = wait`:
 *  - вся тонкая логика таймеров живёт в одном месте и тестируется один раз;
 *  - гарантия «не реже чем раз в wait» следует из maxWait, а не из отдельной,
 *    возможно расходящейся реализации;
 *  - `cancel`/`flush`/`pending` работают одинаково для обеих функций.
 *
 * По умолчанию `leading + trailing`: реакция на первое действие мгновенная,
 * а последнее значение серии не теряется (важно для scroll/resize/input).
 */
export function throttle<A extends unknown[], R>(
  fn: (...args: A) => R,
  wait: number,
  { leading = true, trailing = true }: ThrottleOptions = {},
): Debounced<A, R> {
  return debounce(fn, wait, { leading, trailing, maxWait: wait });
}
