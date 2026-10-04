# dev-yellowweb

Личная библиотека переиспользуемых наработок: React-компоненты, хуки, TS-утилиты и Python-скрипты.

| Раздел                                                   | Содержимое                                                                                                |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [`packages/ui`](packages/ui)                             | `Modal`, `VirtualList` (React + Tailwind; Tailwind-классы — добавьте пакет в `content` вашего приложения) |
| [`packages/hooks`](packages/hooks)                       | `useDebounce`, `useLocalStorage`                                                                          |
| [`packages/utils-ts`](packages/utils-ts)                 | `retry` — чистые TS-хелперы без React                                                                     |
| [`python/image_optimizer`](python/image_optimizer)       | Пакетное сжатие картинок (Pillow)                                                                         |
| [`python/project_scaffolder`](python/project_scaffolder) | CLI-генератор шаблона фичи для Next.js                                                                    |

## Разработка

```bash
npm ci
npm run format:check && npm run lint && npm run typecheck && npm test

# Python
pip install -r python/requirements-dev.txt
ruff check python && pytest python
```

CI (`.github/workflows/ci.yml`) запускает форматирование, линтеры, типы и тесты (TS и Python) при каждом пуше. Подробности — в [CONTRIBUTING.md](CONTRIBUTING.md).

## Лицензия

[MIT](LICENSE)
