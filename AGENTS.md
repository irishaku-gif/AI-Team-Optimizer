# AGENTS.md

## Обзор проекта

AI Team Optimizer - production-only приложение для подбора оптимальной проектной команды из списка сотрудников. Пользовательский интерфейс показывает дашборд, реестр сотрудников, форму подбора команды и историю рекомендаций.

Единственный поддерживаемый режим выполнения: production-деплой на Vercel с React/Vite frontend и serverless PostgreSQL API в `api/[...path].js`.

Удалены и больше не считаются поддерживаемыми режимами:

- локальный Express API server;
- `STORAGE_MODE=memory` и локальное memory storage;
- GitHub Pages/static demo build;
- `VITE_STATIC_DEMO=true` и browser `localStorage` API shim.

## Технологии и архитектура

- Runtime/deploy target: Node.js 24 на Vercel.
- Package manager/workspace: pnpm 10.25.0, pnpm workspaces.
- Frontend: React 19, Vite, Wouter, TanStack React Query, Tailwind CSS, shadcn-style UI, lucide-react, recharts, framer-motion, sonner.
- API: Vercel serverless function `api/[...path].js` на CommonJS JavaScript.
- Database: PostgreSQL через `pg`.
- Migrations: SQL migrations в `api/migrations.js`, runner `scripts/migrate-vercel-api.mjs`.
- API contract: OpenAPI в `lib/api-spec/openapi.yaml`; Orval генерирует React Query client в `lib/api-client-react`.
- AI explanations: optional OpenAI-compatible chat completions call из `api/[...path].js`; deterministic fallback сохраняется.

Архитектурные принципы:

- `api/[...path].js` - единственный backend source of truth.
- Не создавать и не менять production schema внутри request handler. Схема меняется только миграциями.
- Любое изменение API начинается с `lib/api-spec/openapi.yaml`, затем обновляется serverless API и generated client.
- Frontend использует generated hooks/client из `@workspace/api-client-react`, а не ad hoc fetch.
- Все data-backed фичи проектируются через PostgreSQL migration, serverless API route и UI.
- Deployment-specific поведение задаётся env vars и Vercel config, не hardcoded secrets.

## Структура проекта

- `api/[...path].js` - production serverless API. Обрабатывает `/api/healthz`, CRUD сотрудников, подбор команды, историю рекомендаций и summary дашборда.
- `api/migrations.js` - ordered SQL migrations. Это источник изменений структуры production database.
- `scripts/migrate-vercel-api.mjs` - migration runner для `pnpm run db:migrate` и production build.
- `artifacts/team-optimizer` - основной React/Vite frontend. Страницы в `src/pages`, UI в `src/components`, feature logic в `src/features`, helpers в `src/lib`.
- `artifacts/mockup-sandbox` - старый sandbox-артефакт, не является runtime mode и не должен влиять на production-путь.
- `lib/api-spec` - OpenAPI contract и Orval config.
- `lib/api-client-react` - generated React Query API client плюс custom fetch wrapper. Generated файлы не редактировать вручную, если codegen доступен.
- `scripts` - helper scripts, включая package-manager guard и migration runner.
- `vercel.json` - Vercel build/output contract и SPA rewrites.

Удалённые каталоги/файлы не восстанавливать без отдельного решения: `artifacts/api-server`, `lib/db`, `lib/api-zod`, `scripts/build-github-pages.mjs`, `scripts/dev.mjs`, `.github/workflows/pages.yml`, root static snapshot (`assets/`, root `index.html`, `404.html`, `.nojekyll`).

## Существующая документация и файлы решений

- `README.md` - краткий production-only старт и команды.
- `replit.md` - текущая архитектурная заметка по Vercel-only workspace.
- `lib/api-spec/openapi.yaml` - API contract и источник generated frontend client.
- `.env.example` - production env vars для Vercel/PostgreSQL и optional AI explanation.
- `vercel.json` - production deployment contract.
- `api/migrations.js` - database migration source.
- `AGENTS.md` - живая база знаний проекта для coding agents и collaborators.
- `../INDEX.md`, `../REPORT.md`, `../ANALYSIS.md`, `../IMPROVEMENTS.md`, `../IMPLEMENTATION_CHECKLIST.md`, `../README_IMPROVEMENTS.md`, `../00_START_HERE.txt`, `../improvements/*` - исторический пакет анализа от 16 мая 2026. Он полезен как контекст, но часть выводов устарела после перехода на Vercel-only architecture и часть текста mojibaked.

Когда функциональность меняется, в рамках той же задачи обновлять связанные документы: `README.md`, `replit.md`, `openapi.yaml`, `.env.example`, `vercel.json`, `api/migrations.js` и этот `AGENTS.md`, если применимо. Исторические документы из `../` обновлять только если задача явно продолжает тот пакет анализа или меняет его выводы.

## Правила разработки и кодирования

- Использовать pnpm, не npm и не yarn. Корневой `preinstall` проверяет package manager.
- Не отключать `minimumReleaseAge` в `pnpm-workspace.yaml`.
- Для production build использовать `pnpm run build`; он запускает migrations, typecheck и frontend build.
- Для ручного применения схемы использовать `pnpm run db:migrate`.
- Для локального запуска использовать `pnpm run dev`, то есть `vercel dev`.
- Не добавлять обратно локальный Express backend, memory repository или static demo fallback без явного архитектурного решения.
- Не выполнять schema changes через `create table` в request handler. Добавлять migration в `api/migrations.js`.
- Не коммитить реальные `DATABASE_URL`, `POSTGRES_URL`, AI keys или другие secrets.
- API errors должны оставаться стандартизированными: `error`, `code`, `requestId`, optional `details`.
- Валидация API должна быть strict: неизвестные поля отклоняются, JSON body ограничен по размеру, числа не коэрсятся из строк.
- Новый русский user-facing текст хранить в валидном UTF-8; mojibake не использовать как canonical copy.

## Правила проектирования новых функций

- Начинать с пользовательского workflow: dashboard, employees, recommendation, history.
- Для изменения API сначала обновить `lib/api-spec/openapi.yaml`.
- Для изменения данных добавить migration в `api/migrations.js`, затем обновить SQL в `api/[...path].js`.
- Сохранять объяснимость recommendation behavior. Deterministic score: `skill * 2 - load / 50`.
- AI explanation должна оставаться optional: при отсутствии env vars или ошибке provider API возвращает deterministic fallback.
- Preview/production окружения должны иметь отдельные PostgreSQL databases или явно согласованный shared database.
- Не проектировать фичи, завязанные на browser-only persistence; production source of truth - PostgreSQL.

## Требования к тестированию

- Минимум перед сдачей, когда Node/pnpm доступны: `pnpm run typecheck` и `pnpm run build`.
- Для API/schema changes: `pnpm run db:migrate`, затем проверка `/api/healthz`.
- Для API contract changes: `pnpm run codegen` и review generated client changes.
- Для Vercel changes: проверить Preview/Production deployment logs, migration step и affected `/api/*` endpoints.
- Для frontend changes: проверить desktop/mobile widths, loading/error/empty states и text fit.
- Если Node/pnpm недоступны в текущей среде, явно указать это в финальном summary и перечислить выполненные проверки вместо них.
- Для high-risk business logic добавить тестовый harness или документированный ручной сценарий проверки.

## Требования к документации

- Документация входит в definition of done.
- `README.md` обновлять при изменениях setup/deploy commands.
- `replit.md` обновлять при изменениях architecture, stack, command, route или database.
- `openapi.yaml` обновлять при любом изменении request/response contract.
- `.env.example` обновлять при новых env vars.
- `AGENTS.md` обновлять после значимой задачи, если появились новые user preferences, project learnings, constraints или decisions.

### User Preferences

- Пользователь предпочитает прямое выполнение вместо абстрактного планирования: inspect, implement, verify, summarize.
- Пользователь ценит deployment readiness и Vercel/GitHub совместимость.
- Пользователь хочет production-grade database, а не static/local demo.
- Пользователь предпочитает краткую русскую коммуникацию с понятными статусами.
- Пользователь явно запросил, чтобы `AGENTS.md` был постоянно развивающейся базой знаний проекта.
- Пользователь выбрал сужение проекта до единственного production режимa: Vercel + serverless PostgreSQL API.

### Project Learnings

- Реальный репозиторий найден по адресу `C:\Users\ikukushkina\Desktop\Доки\Обучение ИИ\my project\ai-team-optimizer`; путь из environment context может быть недействительным.
- `C:\temp-ai-optimizer` содержит похожую временную копию без `.git`; не считать её актуальной для правок.
- Production API теперь самодостаточен: миграции, строгая валидация, нормализованные ошибки и AI explanation fallback живут в `api/[...path].js` и `api/migrations.js`.
- `pnpm run build` теперь требует доступный PostgreSQL connection string, потому что migration step выполняется до frontend build.
- `lib/db` и `lib/api-zod` удалены вместе с локальным Express backend; OpenAPI codegen теперь генерирует только React client.
- Root static snapshot и GitHub Pages workflow удалены; Vercel output остаётся `artifacts/team-optimizer/dist/public`.
- В текущей Windows-среде `node` и `pnpm` могут отсутствовать в PATH, поэтому локальная verification может быть ограничена diff/static checks.
- Часть исторических русских документов в `../` mojibaked; перед редактированием их нужно восстанавливать или переписывать в UTF-8.

## Чеклист значимой задачи

После каждой значимой задачи:

1. Проверить необходимость обновления документации.
2. Обновить связанные docs и project decision files.
3. Обновить `User Preferences`, если задача раскрывает стабильное предпочтение пользователя.
4. Обновить `Project Learnings`, если задача раскрывает устойчивый technical fact, constraint, bug или decision.
5. Кратко описать изменения, выполненные проверки и непроверенные риски.