# useDebounce

Возвращает значение, которое обновляется только после паузы `delay` мс (по умолчанию 300).

```tsx
import { useDebounce } from '@yellowweb/hooks';

const debouncedQuery = useDebounce(query, 400);
useEffect(() => {
  search(debouncedQuery);
}, [debouncedQuery]);
```
