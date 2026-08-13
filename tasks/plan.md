# Implementation Plan: Webdeck OBS PWA

## Overview

Build the Webdeck OBS PWA from the spec in `docs/specs/webdeck-obs-pwa.md`: a local-first React/React Router app that can be installed on a phone or tablet, connect directly to OBS WebSocket over the local network, and provide a 3x3 configurable deck with trusted OBS state feedback and `.webdeck.json` import/export.

## Architecture Decisions

- Use React Router framework mode with static/prerender output and runtime SSR disabled. This matches the PWA requirement and avoids a backend runtime.
- Use Dexie-backed IndexedDB as the durable source of truth for saved deck configuration, connection settings, and preferences. Zustand is only for active UI/session state.
- Use typed deck/action/icon models and runtime validation before writing imported data into Dexie.
- Use only a curated lucide icon allowlist for button icons. Custom icon upload/import and arbitrary SVG are out of scope.
- Use `obs-websocket-js` through an app-owned adapter in `app/features/obs/` so UI and tests are insulated from the library API.
- Use Vitest for unit/component tests and Playwright for browser/e2e/PWA behavior.

## Tech Stack Contract

The implementation must use the tech stack specified in `docs/specs/webdeck-obs-pwa.md`. Treat this as a project boundary, not a preference list.

| Stack | What to use | Why | How it should appear in implementation |
|-------|-------------|-----|----------------------------------------|
| Package manager | pnpm | Keeps installs and scripts consistent across all tasks. | Use `pnpm` commands only. Commit `pnpm-lock.yaml` once dependencies exist. |
| Build tool | Vite | Fast local development and PWA plugin support. | Configure app build through Vite and avoid adding another bundler. |
| Runtime UI | React + TypeScript | Matches the requested frontend stack and gives typed UI contracts. | Write app code in `.ts`/`.tsx`; keep deck/action/config types explicit. |
| Routing | React Router framework mode | Supports the requested prerender/static app structure. | Use route modules under `app/routes/`; configure runtime SSR off and prerender/static output on. |
| PWA | Vite PWA plugin | Provides manifest and service worker integration without a custom service worker first. | Configure manifest, icons, offline shell, and update behavior through Vite PWA. |
| UI system | shadcn/ui | Gives accessible primitives that can be styled for a serious control surface. | Use shadcn components for dialogs, forms, buttons, menus, tabs, and confirmations. |
| Icons | Curated lucide allowlist | Keeps deck icons consistent, small, and safe to import/export. | Store icons as `{ type: "lucide"; name: string }`; render only allowlisted lucide icons. |
| Forms | React Hook Form | Keeps connection and button editor forms predictable and testable. | Use it for OBS setup, button editor, import options, and validation display. |
| Active state | Zustand | Lightweight state for connection/session/deck UI without server state machinery. | Keep live UI/session state in `app/stores/`; do not use Zustand localStorage persistence. |
| Durable storage | IndexedDB via Dexie.js | Better fit than localStorage for versioned deck data, settings, and future migrations. | Put Dexie schema/repositories in `app/db/`; persist saved config only after validation. |
| OBS client | obs-websocket-js | Typed browser-capable OBS WebSocket client. | Wrap it in `app/features/obs/` adapter; UI must depend on the app adapter interface. |
| Unit/component tests | Vitest | Fast feedback for validation, storage, stores, and component behavior. | Put focused tests in `tests/`; use `pnpm test:unit`. |
| Browser/e2e tests | Playwright | Verifies real browser behavior, mobile/tablet layouts, and PWA flows. | Put tests in `e2e/`; use `pnpm test:e2e`. |

## Stack Usage Rules

- Each implementation task must name the stack pieces it uses before coding.
- Do not substitute libraries or storage choices without updating `docs/specs/webdeck-obs-pwa.md`, `tasks/plan.md`, and `tasks/todo.md` first.
- Keep durable data ownership clear: Dexie persists saved data; Zustand reflects active app state.
- Keep UI ownership clear: shadcn provides primitives; app components provide product behavior and layout.
- Keep OBS ownership clear: only the adapter talks directly to `obs-websocket-js`.
- Keep test ownership clear: Vitest proves logic/components; Playwright proves browser flows and responsive/PWA behavior.

## Dependency Graph

```text
Project scaffold and tooling
    |
    +-- Shared TypeScript models
    |       |
    |       +-- Deck validation and import/export schema
    |       |       |
    |       |       +-- Dexie database module
    |       |       |       |
    |       |       |       +-- Zustand hydration and persistence bridge
    |       |       |
    |       |       +-- Import/export UI flow
    |       |
    |       +-- OBS adapter contract
    |               |
    |               +-- Connection setup flow
    |               +-- Deck action execution
    |               +-- OBS state feedback
    |
    +-- UI shell and shadcn setup
            |
            +-- Deck grid
            +-- Button editor
            +-- PWA polish and Playwright checks
```

## Task List

### Phase 1: Scaffold and Contracts

- [ ] Task 1: Scaffold the React Router PWA project
- [ ] Task 2: Add lint, Vitest, and Playwright tooling
- [ ] Task 3: Add shared deck, icon, connection, and OBS action models
- [ ] Task 4: Add deck config validation and `.webdeck.json` serialization

### Checkpoint: Foundation

- [ ] `pnpm lint` passes
- [ ] `pnpm test:unit` passes
- [ ] `pnpm build` succeeds
- [ ] Validation rejects malformed deck imports before any persistence exists

### Phase 2: Persistence and OBS Boundary

- [ ] Task 5: Add Dexie database module for saved configuration
- [ ] Task 6: Add Zustand session stores hydrated from Dexie
- [ ] Task 7: Add OBS WebSocket adapter with a fakeable interface

### Checkpoint: Data and OBS Boundary

- [ ] `pnpm test:unit` passes
- [ ] `pnpm build` succeeds
- [ ] Deck and connection settings can be saved and loaded through Dexie
- [ ] OBS adapter tests run without real OBS

### Phase 3: Core User Flows

- [ ] Task 8: Build first-launch connection setup
- [ ] Task 9: Build the 3x3 deck grid and button execution flow
- [ ] Task 10: Build lightweight button editor
- [ ] Task 11: Build import/export flow with preview confirmation

### Checkpoint: Core Product

- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] Playwright covers first launch, deck rendering, button editing, and import/export
- [ ] Manual check confirms usable touch targets on phone and tablet viewports

### Phase 4: Trust, Safety, and PWA Finish

- [ ] Task 12: Add OBS state feedback and reconnect/error states
- [ ] Task 13: Add deliberate confirmation for dangerous actions
- [ ] Task 14: Configure PWA manifest, service worker behavior, and install polish
- [ ] Task 15: Final accessibility, responsive, and e2e verification pass

### Checkpoint: Complete

- [ ] All project success criteria in the spec are met
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] `pnpm test:e2e` passes
- [ ] Ready for user review on desktop plus phone/tablet viewport checks

## Parallelization Opportunities

- Tasks 3 and 8 can be partially designed in parallel after the scaffold exists, but Task 8 should wait to merge until the connection model is stable.
- Task 4 and Task 5 are sequential because Dexie persistence should depend on validated config contracts.
- Task 7 can be built in parallel with Task 5 after the shared models exist.
- Tasks 9 and 10 can be parallelized only after the deck model and store APIs are stable.
- Playwright coverage in Tasks 11, 14, and 15 can be expanded in parallel once the flows exist.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Browser-to-OBS connection is blocked by local network, mixed content, or OBS settings | High | Make connection errors specific, document local-network assumptions, and keep the OBS adapter isolated for testing. |
| OBS live state gets out of sync with button UI | High | Subscribe to OBS events where available and refresh state after action calls. |
| Imported JSON corrupts saved deck data | High | Validate and preview imports before writing to Dexie; keep schema version explicit. |
| Dexie migrations become painful later | Medium | Version the Dexie schema from the first implementation and test database upgrade behavior. |
| PWA behavior differs across mobile browsers | Medium | Use Playwright viewport checks plus manual install testing on target devices. |
| Button editor scope expands into a full deck designer | Medium | Keep v1 to action type, required target fields, label, lucide icon, and color. |

## Open Questions

- The planning skill references `../../references/definition-of-done.md`, but that file was not present under `.agents/`. Use the verification gates in this plan until a project Definition of Done is added.
