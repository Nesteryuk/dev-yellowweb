import { useState, type ReactNode } from 'react';

export interface VirtualListProps<T> {
  items: T[];
  /** Фиксированная высота одного элемента в px. */
  itemHeight: number;
  /** Высота видимой области в px. */
  height: number;
  /** Сколько элементов дорисовывать сверху и снизу окна. */
  overscan?: number;
  /** Стабильный ключ элемента; по умолчанию — индекс. */
  getKey?: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
}

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  overscan = 3,
  getKey,
  renderItem,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const end = Math.min(items.length, Math.ceil((scrollTop + height) / itemHeight) + overscan);

  return (
    <div
      data-testid="virtual-list"
      role="list"
      style={{ height, overflowY: 'auto', position: 'relative' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight }}>
        {items.slice(start, end).map((item, i) => {
          const index = start + i;
          return (
            <div
              key={getKey ? getKey(item, index) : index}
              role="listitem"
              aria-setsize={items.length}
              aria-posinset={index + 1}
              style={{
                position: 'absolute',
                top: index * itemHeight,
                height: itemHeight,
                width: '100%',
              }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
