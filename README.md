# Webdeck OBS PWA

Local-first installable OBS control deck built with React Router framework mode, Vite, Dexie, Zustand, and `obs-websocket-js`.

## Stack

- `pnpm`
- Vite
- React + TypeScript
- React Router framework mode with `ssr: false` and prerendered output
- Vite PWA plugin
- Dexie for durable local storage
- Zustand for active UI/session state
- React Hook Form for setup/editor flows
- Vitest for unit and component tests
- Playwright for browser and PWA verification

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm test:unit
pnpm test:e2e
pnpm test:e2e:list
pnpm test
```

## Current Status

As of August 13, 2026, the repo includes:

- first-launch OBS connection setup
- 3x3 deck rendering and action execution
- slot editing with curated lucide icons
- `.webdeck.json` import/export with preview confirmation
- OBS state feedback, disconnect messaging, and reconnect control
- dangerous-action confirmation for stop-stream
- PWA manifest and service-worker update prompt
- Playwright specs for first launch, deck interaction/editing, import/export, OBS disconnect/reconnect state, dangerous-action confirmation, and PWA manifest metadata
- responsive verification wiring for desktop, phone, and tablet Playwright projects

Verified locally in this repository:

- `pnpm lint`
- `pnpm test:unit`
- `pnpm build`
- `pnpm test:e2e:list`

## End-to-End Testing

The Playwright suite is wired and discoverable through `pnpm test:e2e:list`.
It currently expands to 30 tests across 7 spec files and 3 viewport projects.

On this host, full browser execution is currently blocked because Playwright Chromium cannot start without `libnspr4.so`.

Official Playwright docs recommend installing Chromium together with its Linux system dependencies using:

```bash
npx playwright install --with-deps chromium
```

Source: https://github.com/microsoft/playwright/blob/main/docs/src/browsers.md

After the browser dependencies are installed, rerun:

```bash
pnpm test:e2e
```

## Repository Notes

- Durable saved data belongs in Dexie under `app/db/`.
- Active session/UI state belongs in Zustand under `app/stores/`.
- UI code depends on the app-owned OBS adapter, not directly on `obs-websocket-js`.
- Generated outputs such as `build/`, `dist/`, `dev-dist/`, and `test-results/` are ignored from source control.
