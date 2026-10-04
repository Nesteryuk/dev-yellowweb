# useLocalStorage

Состояние, синхронизированное с `localStorage`. Возвращает `[value, set, remove]`.

- SSR-безопасно: на сервере и при гидратации возвращает `initial`, без hydration mismatch;
- синхронизируется между вкладками (событие `storage`) и между хуками в одной вкладке;
- перечитывает значение при смене `key`;
- принимает функциональные обновления; при недоступном или переполненном storage не падает;
- повреждённый JSON → `initial`.

```tsx
import { useLocalStorage } from '@yellowweb/hooks';

const [theme, setTheme, resetTheme] = useLocalStorage('theme', 'light');
```
