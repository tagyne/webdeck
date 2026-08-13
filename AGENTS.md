# Repository Guidelines

## Project Structure & Module Organization

This repository is planned around the Webdeck OBS PWA spec in `docs/specs/webdeck-obs-pwa.md`. Implementation work should follow `tasks/plan.md` and `tasks/todo.md`.

Expected app layout after scaffolding:

- `app/` - React Router framework app source.
- `app/routes/` - route modules.
- `app/components/` - app components; `app/components/ui/` for shadcn/ui.
- `app/features/deck/` - deck grid, editor, icon allowlist, import/export.
- `app/features/obs/` - OBS connection, events, action execution, adapter.
- `app/db/` - Dexie database, table types, versions, migrations.
- `app/stores/` - Zustand active UI/session state.
- `tests/` - Vitest unit and component tests.
- `e2e/` - Playwright browser and PWA tests.
- `public/` - PWA icons and static assets.

## Build, Test, and Development Commands

Use `pnpm` only.

- `pnpm install` - install dependencies.
- `pnpm dev` - run the local dev server.
- `pnpm build` - create the production static/PWA build.
- `pnpm preview` - preview the production build.
- `pnpm lint` - run lint checks.
- `pnpm test` - run the full test suite.
- `pnpm test:unit` - run Vitest tests.
- `pnpm test:e2e` - run Playwright tests.

## Coding Style & Naming Conventions

Use TypeScript for app code and contracts. Prefer explicit discriminated unions for deck actions, OBS state, and import/export schemas. Keep durable data in Dexie; use Zustand only for active UI/session state.

Use shadcn/ui primitives for dialogs, buttons, forms, menus, tabs, and confirmations. Use only curated lucide icons: `{ type: "lucide"; name: string }`. Do not add custom icon imports or arbitrary SVG support.

## Testing Guidelines

Use Vitest for validation, serialization, Dexie repositories, Zustand stores, OBS adapter behavior, and focused component tests. Use Playwright for first launch, connection setup, deck rendering, editor, import/export, dangerous-action confirmation, responsive layouts, and PWA behavior.

Name tests by feature, for example `tests/deck-config.test.ts` or `e2e/import-export.spec.ts`.

## Commit & Pull Request Guidelines

Use the Angular commit convention:

```text
<type>(<scope>): <subject>
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, and `revert`. Keep the subject imperative and lower-case, for example `feat(deck): add config validation` or `test(import): cover preview errors`.

Pull requests should include a short description, linked task/spec section, verification commands run, and screenshots for UI changes.

## Security & Configuration Tips

Never commit real OBS passwords. Keep OBS connection data local, validate imported `.webdeck.json` before writing to Dexie, and do not send OBS settings to remote services.
