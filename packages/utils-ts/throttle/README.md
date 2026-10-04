# throttle

Не чаще одного вызова функции в `wait` мс. Типичные случаи: `scroll`, `resize`, `mousemove`, отправка прогресса.

```ts
import { throttle } from '@yellowweb/utils-ts';

const onScroll = throttle(() => updateProgress(), 100);
window.addEventListener('scroll', onScroll);
// при размонтировании:
window.removeEventListener('scroll', onScroll);
onScroll.cancel();
```

## Опции

| Опция      | По умолчанию | Смысл                                         |
| ---------- | ------------ | --------------------------------------------- |
| `leading`  | `true`       | вызвать сразу по первому вызову окна          |
| `trailing` | `true`       | вызвать в конце окна с последними аргументами |

## Почему так

- **Это `debounce` с `maxWait = wait`** — одна реализация таймеров, один набор тестов, одинаковые `cancel`/`flush`/`pending`.
- **`leading + trailing` по умолчанию**: реакция на первое действие мгновенная, а финальное значение серии не теряется.
- Гарантия: между двумя вызовами `fn` проходит не меньше `wait` мс (проверено тестом на непрерывном потоке вызовов).

## Отличие от debounce

`debounce` ждёт тишины, `throttle` вызывает регулярно, пока идут события.
