import { fireEvent, render, screen } from '@testing-library/react';
import { VirtualList } from './VirtualList';

const items = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);
const setup = (props = {}) =>
  render(
    <VirtualList items={items} itemHeight={20} height={100} renderItem={(x) => x} {...props} />,
  );

// jsdom не считает layout, поэтому проверяем логику окна, а не реальную отрисовку.
describe('VirtualList', () => {
  it('renders only the visible window', () => {
    setup();
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.queryByText('Item 500')).toBeNull();
  });

  it('updates the window on scroll', () => {
    setup();
    fireEvent.scroll(screen.getByTestId('virtual-list'), { target: { scrollTop: 10000 } });
    expect(screen.getByText('Item 500')).toBeInTheDocument();
    expect(screen.queryByText('Item 0')).toBeNull();
  });

  it('exposes list semantics with position info', () => {
    setup();
    const first = screen.getAllByRole('listitem')[0];
    expect(first).toHaveAttribute('aria-posinset', '1');
    expect(first).toHaveAttribute('aria-setsize', '1000');
  });

  it('handles an empty list and a short list', () => {
    const { unmount } = setup({ items: [] });
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    unmount();
    setup({ items: ['a', 'b'] });
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('accepts a custom key', () => {
    setup({ getKey: (item: string) => item });
    expect(screen.getByText('Item 0')).toBeInTheDocument();
  });
});
