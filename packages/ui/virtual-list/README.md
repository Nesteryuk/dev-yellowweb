# VirtualList

Виртуализированный список с **фиксированной** высотой элемента: в DOM попадает только видимое окно + `overscan`.

```tsx
import { VirtualList } from '@yellowweb/ui';

<VirtualList
  items={rows}
  itemHeight={32}
  height={400}
  getKey={(row) => row.id}
  renderItem={(row) => <Row {...row} />}
/>;
```

Ограничения: динамическая высота элементов не поддерживается. В jsdom нет layout, поэтому тесты проверяют логику окна.
