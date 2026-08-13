import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { WebdeckApp } from "../app/routes/_index";
import { createConnectionStore } from "../app/stores/connection-store";
import { createDeckStore } from "../app/stores/deck-store";
import { createObsStore } from "../app/stores/obs-store";
import { DEFAULT_DECK_GRID, DEFAULT_DECK_CONFIG, createStarterDeckConfig, type DeckConfig } from "../app/features/deck/types";
import { FakeObsClient } from "../app/features/obs/fake-obs-client";

function createDangerDeck(): DeckConfig {
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
    ],
  };
}

describe("focus management", () => {
  it("focuses the host field on first launch", async () => {
    render(
      <WebdeckApp
        connectionStore={createConnectionStore({
          repository: {
            get: async () => undefined,
            save: async () => undefined,
          },
        })}
        deckStore={createDeckStore({
          repository: {
            get: async () => DEFAULT_DECK_CONFIG,
            save: async () => undefined,
          },
        })}
        obsStore={createObsStore()}
        obsClient={new FakeObsClient()}
      />,
    );

    const hostInput = await screen.findByLabelText(/host/i);
    expect(hostInput).toHaveFocus();
  });

  it("moves focus into the button editor when a slot is opened", async () => {
    render(
      <WebdeckApp
        connectionStore={createConnectionStore({
          repository: {
            get: async () => ({ host: "192.168.1.20", port: 4455 }),
            save: async () => undefined,
          },
        })}
        deckStore={createDeckStore({
          repository: {
            get: async () => createStarterDeckConfig(),
            save: async () => undefined,
          },
        })}
        obsStore={createObsStore()}
        obsClient={new FakeObsClient()}
      />,
    );

    await screen.findByRole("heading", { name: /main obs deck/i });
    fireEvent.click(screen.getByRole("button", { name: /edit deck/i }));
    fireEvent.click(screen.getByRole("button", { name: /slot 6: empty slot/i }));

    const editor = await screen.findByRole("region", { name: /edit slot 6/i });
    expect(within(editor).getByLabelText(/label/i)).toHaveFocus();
  });

  it("moves focus to the import confirmation action when a preview opens", async () => {
    render(
      <WebdeckApp
        connectionStore={createConnectionStore({
          repository: {
            get: async () => ({ host: "192.168.1.20", port: 4455 }),
            save: async () => undefined,
          },
        })}
        deckStore={createDeckStore({
          repository: {
            get: async () => createStarterDeckConfig(),
            save: async () => undefined,
          },
        })}
        obsStore={createObsStore()}
        obsClient={new FakeObsClient()}
      />,
    );

    await screen.findByRole("heading", { name: /main obs deck/i });
    fireEvent.click(screen.getByRole("button", { name: /import \/ export/i }));

    const importFile = new File(
      [
        JSON.stringify({
          schemaVersion: 1,
          app: "webdeck",
          exportedAt: "2026-08-13T12:00:00.000Z",
          deck: {
            id: "travel-deck",
            name: "Travel Deck",
            grid: { columns: 3, rows: 3 },
            buttons: [],
            updatedAt: "2026-08-13T12:00:00.000Z",
          },
        }),
      ],
      "travel-deck.webdeck.json",
      { type: "application/json" },
    );

    fireEvent.change(screen.getByLabelText(/import deck file/i), {
      target: { files: [importFile] },
    });

    const preview = await screen.findByRole("dialog", { name: /import preview/i });
    await waitFor(() => {
      expect(within(preview).getByRole("button", { name: /replace current deck/i })).toHaveFocus();
    });
  });

  it("moves focus to the dangerous confirmation action when needed", async () => {
    render(
      <WebdeckApp
        connectionStore={createConnectionStore({
          repository: {
            get: async () => ({ host: "192.168.1.20", port: 4455 }),
            save: async () => undefined,
          },
        })}
        deckStore={createDeckStore({
          repository: {
            get: async () => createDangerDeck(),
            save: async () => undefined,
          },
        })}
        obsStore={createObsStore()}
        obsClient={new FakeObsClient()}
      />,
    );

    await screen.findByRole("heading", { name: /danger deck/i });
    fireEvent.click(screen.getByRole("button", { name: /slot 1: stop stream/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /confirm stop stream/i })).toHaveFocus();
    });
  });
});
