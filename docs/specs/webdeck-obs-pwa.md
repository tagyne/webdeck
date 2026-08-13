# Spec: Webdeck OBS PWA

## Objective

Build a dependable installable PWA that turns a phone or tablet into a custom OBS control deck for a personal live-streaming workflow.

The app should connect directly from the browser to OBS WebSocket on the local network, then present a default 3x3 grid of large, trusted controls for common OBS actions such as mute, stream start/stop, recording pause/resume, scene changes, and source visibility toggles.

The first version succeeds when it feels safe to use during a real stream: connection status is obvious, button state updates quickly, and configuration can be backed up or moved between devices with a simple import/export flow.

## Tech Stack

- Package manager: pnpm
- Build tool: Vite
- App runtime: React
- Routing: React Router in framework mode, configured for prerendering/static output rather than runtime SSR
- PWA: Vite PWA plugin
- UI: shadcn/ui
- Icons: curated lucide icon subset for OBS-oriented actions
- Forms: React Hook Form
- State: Zustand for active UI/session state
- Durable storage: IndexedDB through Dexie.js
- Unit and component tests: Vitest
- End-to-end/browser tests: Playwright
- OBS integration: obs-websocket-js from the browser
- Storage: Dexie-backed IndexedDB for connection settings, deck configuration, and app preferences

React Router configuration should disable runtime server rendering for this PWA. Current React Router docs show `ssr: false` for SPA/static mode and `prerender: true` or explicit route lists for build-time prerendering.

## Commands

These commands assume a standard pnpm/Vite project after scaffolding:

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm test
pnpm test:unit
pnpm test:e2e
```

If test or lint scripts do not exist yet, add them before relying on these commands as verification gates.

## Project Structure

```text
app/                  React Router framework app source
app/routes/           Route modules
app/components/       App-specific React components
app/components/ui/    shadcn/ui components
app/features/deck/    Deck grid, deck editor, button model, import/export
app/features/obs/     OBS connection, events, action execution, state sync
app/db/               Dexie database instance, table types, versions, migrations
app/lib/              Shared utilities and validation helpers
app/stores/           Zustand stores and persistence setup
docs/specs/           Product and technical specs
tests/                Vitest unit and component tests
e2e/                  Playwright end-to-end and browser tests
```

## Code Style

Prefer explicit typed action models over loose string maps. Treat deck configuration as data that can be validated, migrated, imported, and exported safely.

```ts
type DeckButtonAction =
  | { type: "toggleInputMute"; inputName: string }
  | { type: "setCurrentProgramScene"; sceneName: string }
  | { type: "toggleSourceVisibility"; sceneName: string; sourceName: string }
  | { type: "startStream" }
  | { type: "stopStream" }
  | { type: "toggleRecordPause" };

type IconRef = { type: "lucide"; name: string };

type DeckButton = {
  id: string;
  slot: number;
  label: string;
  icon: IconRef;
  color: string;
  action: DeckButtonAction;
};
```

Use Zustand for live UI/application state and Dexie for durable persistence. Zustand stores may hydrate from Dexie and write changes back through explicit persistence functions, but the long-lived source of truth for saved deck configuration should be IndexedDB.

```ts
import Dexie, { type EntityTable } from "dexie";

type DeckRecord = {
  id: string;
  name: string;
  schemaVersion: number;
  grid: {
    columns: number;
    rows: number;
  };
  buttons: DeckButton[];
  updatedAt: string;
};

const db = new Dexie("WebdeckDatabase") as Dexie & {
  decks: EntityTable<DeckRecord, "id">;
};

db.version(1).stores({
  decks: "id, updatedAt",
});
```

Conventions:

- Use TypeScript for app code and config contracts.
- Keep OBS request/event mapping in `app/features/obs/`, away from UI components.
- Keep import/export validation in `app/features/deck/`, away from file input UI.
- Keep Dexie schema definitions and migrations in `app/db/`.
- Prefer small feature modules over a generic global utilities folder.
- Validate untrusted imported JSON before writing it to Dexie.

## Core Flows

### First Launch and Connection

1. User opens the PWA.
2. If no saved OBS connection exists, show connection setup first.
3. User enters host, port, and password.
4. App tests the OBS WebSocket connection.
5. On success, app persists connection settings in Dexie and navigates to the deck.
6. On failure, app shows a specific error and keeps the setup form editable.

### Deck Control

1. User sees a compact grid of large tap targets.
2. Each button shows label, icon, color, and current state where available.
3. Tapping a button sends the mapped OBS WebSocket action.
4. OBS events update visible state, such as active scene, muted input, stream status, recording status, and source visibility.
5. Dangerous actions such as stopping stream or recording require a deliberate confirmation or press-and-hold interaction.

### Lightweight Button Setup

1. User opens a deck slot.
2. User chooses action type.
3. User configures the required target fields, such as scene, input, or source.
4. User sets label, icon, and color.
5. App validates required fields before saving.

### Icon Management

Use a curated OBS-oriented subset of lucide icons in v1. The button editor should expose common live-production symbols such as mic, volume, video, eye, radio, play, pause, square, clapperboard, monitor, image, settings, and alert/confirmation icons.

Store button icons as typed lucide icon references rather than raw component names. This keeps the deck config portable while keeping icon rendering simple and predictable.

V1 icon format:

```ts
type IconRef = { type: "lucide"; name: string };
```

Custom icon uploads, imported images, and arbitrary SVG icons are out of scope. The app should only render icons from the curated lucide allowlist.

### Import and Export

Use a versioned JSON file with the extension `.webdeck.json`.

Export should download the current deck configuration as a human-readable JSON file. Import should validate and preview the file before replacing the current deck.

Passwords must not be included by default. If password export is ever supported, it must require an explicit opt-in checkbox and the import preview must clearly show that sensitive connection data is present.

Recommended v1 export shape:

```json
{
  "schemaVersion": 1,
  "app": "webdeck",
  "exportedAt": "2026-08-13T12:00:00.000Z",
  "deck": {
    "name": "Main OBS Deck",
    "grid": {
      "columns": 3,
      "rows": 3
    },
    "buttons": [
      {
        "id": "mute-mic",
        "slot": 0,
        "label": "Mic",
        "icon": {
          "type": "lucide",
          "name": "mic"
        },
        "color": "#ef4444",
        "action": {
          "type": "toggleInputMute",
          "inputName": "Mic/Aux"
        }
      }
    ]
  },
  "connection": {
    "host": "192.168.1.20",
    "port": 4455,
    "includePassword": false
  }
}
```

Import validation must check:

- JSON parses successfully.
- `app` is `webdeck`.
- `schemaVersion` is supported.
- Grid dimensions are within app limits.
- Button slots fit within the grid.
- Button IDs are unique.
- Button icon references use the lucide type and known allowlisted lucide icon names.
- Action type is supported.
- Required fields for each action are present.
- Connection data, if present, is structurally valid.

For v1, import replaces the current deck after preview confirmation. Merge import, multiple profiles, and conflict resolution are out of scope.

## Testing Strategy

Use Vitest for unit and component tests. Use Playwright for end-to-end and browser/PWA behavior tests.

Use focused Vitest tests around the highest-risk logic:

- Unit tests for deck config validation.
- Unit tests for import/export serialization.
- Unit tests for schema migration once `schemaVersion` increments.
- Unit tests for OBS action mapping.
- Component tests for connection form validation and import preview behavior.

Use Playwright for browser-level verification:

- First-launch connection setup flow.
- Deck grid rendering on phone and tablet viewports.
- Import/export happy paths and invalid-file handling.
- Dangerous action confirmation or press-and-hold behavior.
- PWA installability signals where the browser exposes them.
- Touch targets, connection states, and non-overlapping UI on desktop and mobile viewport sizes.

OBS WebSocket behavior should be wrapped behind a small interface so tests can use a fake client instead of requiring OBS to run.

Dexie behavior should be tested through a small database module boundary. Unit tests can use an in-memory or isolated IndexedDB-compatible test setup so deck persistence, schema creation, and migrations can be verified without browser-only manual checks.

## Boundaries

Always:

- Keep the app local-first.
- Validate imported config before saving.
- Persist saved configuration in Dexie-backed IndexedDB.
- Keep OBS password out of export by default.
- Show clear connection and action feedback.
- Protect dangerous live-stream actions with a deliberate interaction.
- Prefer simple v1 flows over configurable abstractions.

Ask first:

- Adding cloud sync, accounts, or remote-over-internet access.
- Exporting OBS passwords by default.
- Adding new major dependencies.
- Changing the selected stack.
- Changing durable storage away from Dexie-backed IndexedDB.
- Adding advanced macros, folders, profiles, or drag-and-drop editing.

Never:

- Commit secrets or real OBS passwords.
- Send OBS connection details to a remote service.
- Trust imported JSON without validation.
- Hide connection errors behind a generic failure state.
- Let destructive OBS actions fire from accidental taps.

## Success Criteria

- The PWA can be installed on a phone or tablet.
- The first screen or modal collects OBS WebSocket host, port, and password.
- The app connects directly to OBS WebSocket over the local network with no backend proxy.
- The deck defaults to a 3x3 grid of configurable buttons, with responsive sizing for phone and tablet viewports.
- Buttons can execute at least these action families: input mute toggle, stream start/stop, recording pause/resume, scene change, and source visibility toggle.
- Button state reflects OBS state where OBS exposes the needed events or request responses.
- Deck configuration and connection settings persist through Dexie-backed IndexedDB.
- Button configuration supports a curated lucide icon subset.
- User can export a `.webdeck.json` file.
- User can import a `.webdeck.json` file after validation and preview.
- Import replaces the current deck only after explicit confirmation.
- OBS password is excluded from export unless the user explicitly opts in.

## Not Doing In V1

- User accounts or authentication.
- Cloud sync.
- Remote access over the public internet.
- Multi-user collaboration.
- Multiple profiles or deck folders.
- Custom icon upload/import.
- Arbitrary SVG icons.
- Drag-and-drop deck editing.
- Advanced macros or chained actions.
- Plugin marketplace.
- Native mobile wrapper.

## Open Questions

- None for the current v1 spec.

## Resolved Decisions

- First deck grid: default to 3x3 for v1. Keep slot positions stable and use responsive sizing for phone and tablet viewports.
- Button icons: expose only a curated OBS-oriented subset of lucide icons, rather than the full icon library or custom imported icons.
- Exported connection settings: include host and port by default, exclude password by default, and require explicit opt-in before exporting any password.
- Browser OBS client: use `obs-websocket-js` behind a small app-owned adapter in `app/features/obs/`.
- Durable storage: use IndexedDB through Dexie.js. Keep Zustand for active UI/session state and use Dexie as the saved configuration database.
