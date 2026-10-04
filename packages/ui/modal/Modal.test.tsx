import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is named by its title via aria-labelledby', () => {
    render(
      <Modal open onClose={() => {}} title="Settings">
        Content
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Settings' })).toHaveTextContent('Content');
  });

  it('uses ariaLabel when there is no title', () => {
    render(
      <Modal open onClose={() => {}} ariaLabel="Quick view">
        Content
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Quick view' })).toBeInTheDocument();
  });

  it('closes on Escape and on overlay click, but not on content click', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        Content
      </Modal>,
    );
    fireEvent.click(screen.getByText('Content'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('does not resubscribe and calls the latest onClose', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <Modal open onClose={first}>
        x
      </Modal>,
    );
    rerender(
      <Modal open onClose={second}>
        x
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll while open and restores it on close', () => {
    document.body.style.overflow = 'auto';
    const { rerender } = render(
      <Modal open onClose={() => {}}>
        x
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    rerender(
      <Modal open={false} onClose={() => {}}>
        x
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('auto');
  });

  it('moves focus inside, traps Tab, and restores focus on close', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const ui = (open: boolean) => (
      <Modal open={open} onClose={() => {}} title="T">
        <button>one</button>
        <button>two</button>
      </Modal>
    );
    const { rerender } = render(ui(true));
    const one = screen.getByText('one');
    const two = screen.getByText('two');
    expect(one).toHaveFocus();

    two.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(one).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(two).toHaveFocus();

    rerender(ui(false));
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it('renders nothing during server rendering', () => {
    expect(
      renderToString(
        <Modal open onClose={() => {}}>
          x
        </Modal>,
      ),
    ).toBe('');
  });
});
