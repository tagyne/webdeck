import type { Page } from "@playwright/test";

import { createStarterDeckConfig, DEFAULT_DECK_GRID, type DeckConfig } from "../app/features/deck/types";

export async function installHarness(page: Page, config: Record<string, unknown>) {
  await page.addInitScript((value) => {
    window.__WEBDECK_E2E__ = {
      config: value as typeof window.__WEBDECK_E2E__["config"],
    };
  }, config);
}

export async function readObsCalls(page: Page) {
  return page.evaluate(() => window.__WEBDECK_E2E__?.runtime?.getCalls() ?? []);
}

export async function pushObsState(
  page: Page,
  partial: Record<string, unknown>,
) {
  await page.evaluate((nextState) => {
    window.__WEBDECK_E2E__?.runtime?.pushObsState(
      nextState as Parameters<NonNullable<typeof window.__WEBDECK_E2E__>["runtime"]["pushObsState"]>[0],
    );
  }, partial);
}

export function createDangerDeck(): DeckConfig {
  return {
    id: "danger-deck",
    name: "Danger Deck",
    grid: DEFAULT_DECK_GRID,
    updatedAt: "2026-08-13T12:00:00.000Z",
    buttons: [
      {
        id: "stop-stream",
        slot: 0,
        label: "Stop Stream",
        icon: { type: "lucide", name: "triangle-alert" },
        color: "#b91c1c",
        action: { type: "stopStream" },
      },
      {
        id: "mute-mic",
        slot: 1,
        label: "Mic",
        icon: { type: "lucide", name: "mic" },
        color: "#dc2626",
        action: { type: "toggleInputMute", inputName: "Mic/Aux" },
      },
    ],
  };
}

export function createImportDeckPayload() {
  return JSON.stringify(
    {
      schemaVersion: 1,
      app: "webdeck",
      exportedAt: "2026-08-13T12:00:00.000Z",
      deck: {
        id: "travel-deck",
        name: "Travel Deck",
        grid: { columns: 3, rows: 3 },
        buttons: [
          {
            id: "scene-brb",
            slot: 0,
            label: "BRB",
            icon: { type: "lucide", name: "monitor" },
            color: "#2563eb",
            action: { type: "setCurrentProgramScene", sceneName: "BRB" },
          },
        ],
        updatedAt: "2026-08-13T12:00:00.000Z",
      },
      connection: {
        host: "192.168.1.44",
        port: 4455,
        includePassword: false,
      },
    },
    null,
    2,
  );
}

export { createStarterDeckConfig };
