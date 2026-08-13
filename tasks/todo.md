# Webdeck OBS PWA Task List

## Current Status

As of Thursday, August 13, 2026:

- The repo includes the planned scaffold, persistence layer, OBS boundary, core deck flows, dangerous-action safeguards, reconnect handling, offline shell behavior, responsive control safeguards, and PWA update prompt.
- Local source verification passes with `pnpm lint`, `pnpm test:unit`, and `pnpm build`.
- Playwright specs now exist for first launch, deck interaction/editing, import/export, OBS disconnect/reconnect state, dangerous-action confirmation, PWA manifest metadata, and responsive desktop/phone/tablet coverage, and they are discoverable via `pnpm test:e2e:list`.
- The offline shell behavior is covered locally: saved deck UI remains visible while OBS is disconnected/unreachable.

Remaining blocker:

- `pnpm test:e2e` is blocked by the host browser runtime because Chromium cannot start without `libnspr4.so`. Until that system dependency is installed, the final browser-execution gates in Tasks 2, 11, 14, and 15 cannot be proven on this machine.

## Task 1: Scaffold the React Router PWA project

**Description:** Create the initial pnpm/Vite/React Router framework-mode app with TypeScript, Tailwind/shadcn prerequisites, and Vite PWA wiring.

**Stack to use:** pnpm, Vite, React, TypeScript, React Router framework mode, Tailwind/shadcn prerequisites, and Vite PWA. Use this stack because it is the approved static PWA foundation; configure it through `package.json`, Vite config, React Router config, and app route files.

**Acceptance criteria:**
- [x] `package.json` includes scripts for `dev`, `build`, and `preview`.
- [x] React Router is configured for static/prerender output with runtime SSR disabled.
- [x] The starter app renders through React Router.

**Verification:**
- [x] Build succeeds: `pnpm build`
- [ ] Manual check: `pnpm dev` serves the starter app.

**Dependencies:** None

**Files likely touched:**
- `package.json`
- `vite.config.ts`
- `react-router.config.ts`
- `app/root.tsx`
- `app/routes/_index.tsx`

**Estimated scope:** Medium: 3-5 files

## Task 2: Add lint, Vitest, and Playwright tooling

**Description:** Add linting, Vitest unit/component test setup, Playwright browser test setup, and minimal smoke tests.

**Stack to use:** pnpm scripts, Vitest, Playwright, TypeScript-aware linting. Use Vitest for fast logic/component feedback and Playwright for real browser/PWA checks; expose the commands exactly as `pnpm lint`, `pnpm test`, `pnpm test:unit`, and `pnpm test:e2e`.

**Acceptance criteria:**
- [x] `package.json` includes scripts for `lint`, `test`, `test:unit`, and `test:e2e`.
- [x] Vitest has a passing smoke test.
- [ ] Playwright has a passing smoke test against the dev server.

**Verification:**
- [x] Tests pass: `pnpm lint`
- [ ] Tests pass: `pnpm test`
- [ ] Tests pass: `pnpm test:e2e`
- [x] Build succeeds: `pnpm build`

**Dependencies:** Task 1

**Files likely touched:**
- `package.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `tests/smoke.test.ts`
- `e2e/smoke.spec.ts`

**Estimated scope:** Medium: 3-5 files

## Task 3: Add shared deck and action models

**Description:** Define the TypeScript contracts for decks, buttons, lucide icon references, connection settings, OBS actions, and OBS state.

**Stack to use:** TypeScript and lucide icon references. Use typed discriminated unions so deck config, import/export, Dexie records, Zustand stores, and OBS adapter calls all share one contract.

**Acceptance criteria:**
- [x] Deck defaults represent a 3x3 grid.
- [x] Button icons only allow `{ type: "lucide"; name: string }`.
- [x] OBS action types cover mute toggle, scene change, source visibility toggle, stream start/stop, and recording pause/resume.

**Verification:**
- [x] Tests pass: `pnpm test:unit`
- [x] Build succeeds: `pnpm build`
- [ ] Manual check: Type exports are importable from feature modules.

**Dependencies:** Task 2

**Files likely touched:**
- `app/features/deck/types.ts`
- `app/features/obs/types.ts`
- `tests/deck-types.test.ts`

**Estimated scope:** Small: 1-2 files

## Task 4: Add config validation and JSON serialization

**Description:** Implement runtime validation for `.webdeck.json` imports and export serialization for the v1 schema.

**Stack to use:** TypeScript plus Vitest. Use runtime validation before Dexie persistence because imported JSON is untrusted; verify the contract with focused unit tests.

**Acceptance criteria:**
- [x] Valid v1 configs parse into typed app data.
- [x] Invalid schema version, duplicate button IDs, out-of-range slots, unsupported lucide names, and missing action fields are rejected.
- [x] Export produces stable, human-readable `.webdeck.json` without password by default.

**Verification:**
- [x] Tests pass: `pnpm test:unit`
- [x] Build succeeds: `pnpm build`
- [ ] Manual check: Sample exported JSON matches the spec shape.

**Dependencies:** Task 3

**Files likely touched:**
- `app/features/deck/config-schema.ts`
- `app/features/deck/import-export.ts`
- `tests/deck-config.test.ts`

**Estimated scope:** Medium: 3-5 files

## Task 5: Add Dexie persistence module

**Description:** Create the Dexie database module, typed tables, version 1 schema, and repository-style functions for saved decks, connection settings, and preferences.

**Stack to use:** Dexie.js over IndexedDB with TypeScript table types and Vitest. Use Dexie because durable deck data needs a real browser database with schema versions; keep all database setup under `app/db/`.

**Acceptance criteria:**
- [x] Dexie database is defined in `app/db/`.
- [x] Deck and connection records can be created, read, updated, and replaced.
- [x] Tests run against isolated IndexedDB-compatible storage.

**Verification:**
- [x] Tests pass: `pnpm test:unit`
- [x] Build succeeds: `pnpm build`
- [ ] Manual check: Browser devtools shows the expected IndexedDB database after saving.

**Dependencies:** Task 4

**Files likely touched:**
- `app/db/database.ts`
- `app/db/deck-repository.ts`
- `app/db/connection-repository.ts`
- `tests/db.test.ts`

**Estimated scope:** Medium: 3-5 files

## Task 6: Add Zustand session stores

**Description:** Add Zustand stores for active deck, connection status, OBS state, and editor state, hydrated from Dexie through explicit load/save functions.

**Stack to use:** Zustand for active UI/session state, Dexie repositories for durable writes, and Vitest. Use Zustand to keep the UI responsive while Dexie remains the saved source of truth; do not use localStorage persistence.

**Acceptance criteria:**
- [x] Stores do not persist directly to localStorage.
- [x] Active deck and connection settings hydrate from Dexie on startup.
- [x] Store save operations write validated data through the Dexie repositories.

**Verification:**
- [x] Tests pass: `pnpm test:unit`
- [x] Build succeeds: `pnpm build`
- [ ] Manual check: Reloading the app restores saved deck data from IndexedDB.

**Dependencies:** Task 5

**Files likely touched:**
- `app/stores/deck-store.ts`
- `app/stores/connection-store.ts`
- `app/stores/obs-store.ts`
- `tests/stores.test.ts`

**Estimated scope:** Medium: 3-5 files

## Task 7: Add OBS WebSocket adapter

**Description:** Wrap `obs-websocket-js` in an app-owned adapter that handles connect/disconnect, calls, event subscription, and normalized errors.

**Stack to use:** obs-websocket-js, TypeScript adapter interfaces, fake test adapter, and Vitest. Use the adapter so React components never depend directly on the third-party OBS client.

**Acceptance criteria:**
- [x] UI code depends on the adapter interface, not directly on `obs-websocket-js`.
- [x] Adapter exposes methods for all v1 OBS action families.
- [x] Fake adapter supports tests without requiring OBS.

**Verification:**
- [x] Tests pass: `pnpm test:unit`
- [x] Build succeeds: `pnpm build`
- [ ] Manual check: Adapter can be wired to a real OBS URL in development.

**Dependencies:** Task 3

**Files likely touched:**
- `app/features/obs/obs-client.ts`
- `app/features/obs/fake-obs-client.ts`
- `app/features/obs/action-runner.ts`
- `tests/obs-client.test.ts`

**Estimated scope:** Medium: 3-5 files

## Task 8: Build first-launch connection setup

**Description:** Implement the first screen or modal for OBS host, port, and password using React Hook Form and the OBS adapter.

**Stack to use:** React, React Router route UI, shadcn form/dialog/button primitives, React Hook Form, Zustand, Dexie, obs-websocket-js adapter, Vitest, and Playwright. Use this mix because connection setup touches form validation, persistence, app state, and browser flow.

**Acceptance criteria:**
- [x] Setup appears when no saved connection exists.
- [x] Successful connection saves settings to Dexie and moves to the deck.
- [x] Failed connection shows a specific, editable error state.

**Verification:**
- [ ] Tests pass: `pnpm test`
- [x] Build succeeds: `pnpm build`
- [ ] Manual check: Try success and failure with the fake OBS adapter.

**Dependencies:** Tasks 6 and 7

**Files likely touched:**
- `app/routes/_index.tsx`
- `app/features/obs/connection-form.tsx`
- `app/features/obs/use-obs-connection.ts`
- `tests/connection-form.test.tsx`
- `e2e/connection.spec.ts`

**Estimated scope:** Medium: 3-5 files

## Task 9: Build deck grid and button execution

**Description:** Implement the 3x3 deck screen with large tap targets, lucide icons, labels, colors, and action execution through the OBS adapter.

**Stack to use:** React, shadcn buttons/tooltips where useful, curated lucide icons, Zustand, OBS adapter, Vitest, and Playwright. Use React for the grid, Zustand for active deck/OBS state, and Playwright to verify phone/tablet layout.

**Acceptance criteria:**
- [x] Deck renders nine stable slots with responsive phone/tablet sizing.
- [x] Configured buttons execute their mapped OBS actions.
- [x] Empty slots are visible and ready for editing.

**Verification:**
- [ ] Tests pass: `pnpm test`
- [x] Build succeeds: `pnpm build`
- [ ] Manual check: Tap configured buttons and verify fake adapter calls.

**Dependencies:** Tasks 6 and 7

**Files likely touched:**
- `app/features/deck/deck-grid.tsx`
- `app/features/deck/deck-button.tsx`
- `app/features/deck/use-run-deck-action.ts`
- `tests/deck-grid.test.tsx`
- `e2e/deck.spec.ts`

**Estimated scope:** Medium: 3-5 files

## Task 10: Build lightweight button editor

**Description:** Add the slot editor for action type, required action targets, label, lucide icon, and color.

**Stack to use:** React, shadcn dialog/form controls, React Hook Form, curated lucide allowlist, Zustand, Dexie, Vitest, and Playwright. Use React Hook Form because editor validation changes by action type.

**Acceptance criteria:**
- [x] Editor validates required fields per action type.
- [x] Only curated lucide icons can be selected.
- [x] Saving updates Dexie and the active Zustand deck state.

**Verification:**
- [ ] Tests pass: `pnpm test`
- [x] Build succeeds: `pnpm build`
- [ ] Manual check: Configure one button for each v1 action family.

**Dependencies:** Task 9

**Files likely touched:**
- `app/features/deck/button-editor.tsx`
- `app/features/deck/icon-picker.tsx`
- `app/features/deck/action-fields.tsx`
- `tests/button-editor.test.tsx`
- `e2e/button-editor.spec.ts`

**Estimated scope:** Medium: 3-5 files

## Task 11: Build import/export UI

**Description:** Add export download and import file selection with validation, preview, and explicit replace confirmation.

**Stack to use:** React, shadcn dialog/buttons, React Hook Form for import options if needed, deck validation/serialization, Dexie, Zustand, Vitest, and Playwright. Use JSON import/export as the portable config format and write to Dexie only after preview confirmation.

**Acceptance criteria:**
- [x] Export downloads a `.webdeck.json` file matching schema version 1.
- [x] Import preview shows deck name, grid size, button count, and connection setting presence.
- [x] Import replaces the current deck only after explicit confirmation.

**Verification:**
- [ ] Tests pass: `pnpm test`
- [x] Build succeeds: `pnpm build`
- [ ] Manual check: Export a deck, reset local data, import it, and confirm it restores.

**Dependencies:** Tasks 4 and 6

**Files likely touched:**
- `app/features/deck/import-export-panel.tsx`
- `app/features/deck/import-preview-dialog.tsx`
- `app/features/deck/use-import-export.ts`
- `tests/import-export-ui.test.tsx`
- `e2e/import-export.spec.ts`

**Estimated scope:** Medium: 3-5 files

## Task 12: Add OBS state feedback and reconnect states

**Description:** Subscribe to OBS events and reflect active scene, mute state, stream/recording state, source visibility, connection loss, and reconnect attempts in the UI.

**Stack to use:** obs-websocket-js adapter events, Zustand OBS state, React deck UI, Vitest, and Playwright. Use OBS events for trustable live feedback and keep reconnect state visible through app-owned state.

**Acceptance criteria:**
- [x] Buttons show current state where OBS exposes the state.
- [x] Connection loss is visible and does not imply actions succeeded.
- [x] Reconnect path can restore state without rebuilding the deck.

**Verification:**
- [ ] Tests pass: `pnpm test`
- [x] Build succeeds: `pnpm build`
- [ ] Manual check: Simulate OBS disconnect/reconnect with the fake adapter.

**Dependencies:** Tasks 7 and 9

**Files likely touched:**
- `app/features/obs/obs-events.ts`
- `app/stores/obs-store.ts`
- `app/features/deck/deck-button-state.tsx`
- `tests/obs-state.test.ts`
- `e2e/obs-state.spec.ts`

**Estimated scope:** Medium: 3-5 files

## Task 13: Add dangerous action confirmation

**Description:** Protect stop-stream and recording-stop style actions with a deliberate confirmation or press-and-hold interaction.

**Stack to use:** React, shadcn confirmation primitives, Zustand transient UI state, OBS adapter, Vitest, and Playwright. Use shadcn for accessible confirmation UI and Playwright to prove accidental taps do not fire dangerous actions.

**Acceptance criteria:**
- [x] Dangerous actions cannot fire from a single accidental tap.
- [x] Confirmation state is obvious and dismissible.
- [x] Non-dangerous actions remain fast single-tap controls.

**Verification:**
- [ ] Tests pass: `pnpm test`
- [x] Build succeeds: `pnpm build`
- [ ] Manual check: Attempt accidental tap and deliberate confirmation paths.

**Dependencies:** Task 9

**Files likely touched:**
- `app/features/deck/dangerous-action-button.tsx`
- `app/features/deck/deck-button.tsx`
- `tests/dangerous-actions.test.tsx`
- `e2e/dangerous-actions.spec.ts`

**Estimated scope:** Medium: 3-5 files

## Task 14: Configure PWA install behavior

**Description:** Finalize the Vite PWA manifest, app icons, service worker strategy, offline shell behavior, and install metadata.

**Stack to use:** Vite PWA plugin, Vite config, React app shell, Dexie, and Playwright. Use Vite PWA for manifest/service worker setup and Dexie so the offline shell can still show saved deck data.

**Acceptance criteria:**
- [x] Manifest has app name, short name, theme color, display mode, and required icons.
- [x] Offline shell loads enough UI to show saved deck and disconnected OBS state.
- [x] Service worker update behavior is visible and not disruptive.

**Verification:**
- [ ] Tests pass: `pnpm test:e2e`
- [x] Build succeeds: `pnpm build`
- [ ] Manual check: Browser install prompt/signals are present where supported.

**Dependencies:** Tasks 1, 6, and 9

**Files likely touched:**
- `vite.config.ts`
- `public/`
- `app/components/app-shell.tsx`
- `e2e/pwa.spec.ts`

**Estimated scope:** Medium: 3-5 files

## Task 15: Final responsive, accessibility, and release verification

**Description:** Run the final quality pass across desktop, phone, and tablet viewports, fixing layout, accessibility, and test gaps discovered during verification.

**Stack to use:** React, shadcn, lucide, Zustand, Dexie, obs-websocket-js adapter, Vitest, Playwright, and pnpm scripts. Use the full approved stack here because this pass verifies the integrated product rather than one subsystem.

**Acceptance criteria:**
- [ ] Touch targets are comfortable on phone and tablet.
- [ ] Text does not overflow or overlap.
- [x] Keyboard/focus states work for setup, editor, import, and confirmations.

**Verification:**
- [x] Tests pass: `pnpm lint`
- [ ] Tests pass: `pnpm test`
- [ ] Tests pass: `pnpm test:e2e`
- [x] Build succeeds: `pnpm build`
- [ ] Manual check: Full first-launch-to-deck workflow works in browser.

**Dependencies:** Tasks 8 through 14

**Files likely touched:**
- `app/styles.css`
- `app/components/app-shell.tsx`
- `app/features/deck/*`
- `app/features/obs/*`
- `e2e/*.spec.ts`

**Estimated scope:** Medium: 3-5 files
