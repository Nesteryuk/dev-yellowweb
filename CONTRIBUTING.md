# Contributing

## TypeScript

```bash
npm ci
npm run format && npm run lint && npm run typecheck && npm test
```

- Каждый компонент/хук/утилита живёт в своей папке: исходник, `*.test.ts(x)`, `README.md`.
- Новое публичное API экспортируется из `index.ts` пакета.
- Pre-commit (husky + lint-staged) форматирует и линтит staged-файлы.

## Python

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r python/requirements-dev.txt
ruff check python && ruff format python && pytest python
```

## Коммиты

Автор — `Nesteryuk <dev@yellowweb.ru>`. Сообщения — в повелительном наклонении, одна логическая правка на коммит.
