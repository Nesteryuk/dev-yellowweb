# Modal

Доступный модальный диалог. Стили — Tailwind-классы.

- рендер в portal (`document.body`), безопасен для SSR / Next.js;
- `role="dialog"`, `aria-modal`, имя через `aria-labelledby` (`title`) или `ariaLabel`;
- фокус-трап (Tab / Shift+Tab), фокус возвращается на элемент, открывший окно;
- блокировка скролла `body` пока окно открыто;
- закрытие по Esc и клику по оверлею; `onClose` может быть нестабильной ссылкой.

```tsx
import { Modal } from '@yellowweb/ui';

<Modal open={open} onClose={() => setOpen(false)} title="Заголовок">
  Содержимое
</Modal>;
```
