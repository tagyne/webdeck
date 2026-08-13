import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { WebdeckApp } from "../app/routes/_index";
import { createConnectionStore } from "../app/stores/connection-store";
import { createDeckStore } from "../app/stores/deck-store";
import { createObsStore } from "../app/stores/obs-store";
import { FakeObsClient } from "../app/features/obs/fake-obs-client";
import type { DeckConfig } from "../app/features/deck/types";
import { DEFAULT_DECK_GRID } from "../app/features/deck/types";

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

describe("dangerous action safeguards", () => {
  it("does not fire dangerous actions on a single tap", async () => {
    const client = new FakeObsClient();

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
        obsClient={client}
      />,
    );

    await screen.findByRole("heading", { name: /danger deck/i });
    await client.connect({ host: "192.168.1.20", port: 4455 });

    fireEvent.click(screen.getByRole("button", { name: /slot 1: stop stream/i }));

    expect(client.calls).toEqual([]);
    expect(await screen.findByRole("button", { name: /confirm stop stream/i })).toBeInTheDocument();
  });

  it("fires dangerous actions only after explicit confirmation while normal actions stay single tap", async () => {
    const client = new FakeObsClient();

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
        obsClient={client}
      />,
    );

    await screen.findByRole("heading", { name: /danger deck/i });
    await client.connect({ host: "192.168.1.20", port: 4455 });

    fireEvent.click(screen.getByRole("button", { name: /slot 2: mic/i }));

    await waitFor(() => {
      expect(client.calls).toEqual([{ type: "toggleInputMute", inputName: "Mic/Aux" }]);
    });

    fireEvent.click(screen.getByRole("button", { name: /slot 1: stop stream/i }));
    fireEvent.click(await screen.findByRole("button", { name: /confirm stop stream/i }));

    await waitFor(() => {
      expect(client.calls).toEqual([
        { type: "toggleInputMute", inputName: "Mic/Aux" },
        { type: "stopStream" },
      ]);
    });
  });
});
