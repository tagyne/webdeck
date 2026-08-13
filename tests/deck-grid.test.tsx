import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { createConnectionStore } from "../app/stores/connection-store";
import { createDeckStore } from "../app/stores/deck-store";
import { createObsStore } from "../app/stores/obs-store";
import {
  DEFAULT_DECK_GRID,
  createStarterDeckConfig,
  getDeckSlotCount,
} from "../app/features/deck/types";
import { FakeObsClient } from "../app/features/obs/fake-obs-client";
import { WebdeckApp } from "../app/routes/_index";

describe("deck grid", () => {
  it("renders nine stable slots and shows empty slots for editing", async () => {
    render(
      <WebdeckApp
        connectionStore={createConnectionStore({
          repository: {
            get: async () => ({
              host: "192.168.1.20",
              port: 4455,
            }),
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

    expect(screen.getAllByRole("button", { name: /slot/i })).toHaveLength(
      getDeckSlotCount(DEFAULT_DECK_GRID),
    );
    expect(screen.getAllByText(/empty slot/i).length).toBeGreaterThan(0);
  });

  it("runs configured buttons through the obs client", async () => {
    const client = new FakeObsClient();

    render(
      <WebdeckApp
        connectionStore={createConnectionStore({
          repository: {
            get: async () => ({
              host: "192.168.1.20",
              port: 4455,
            }),
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
        obsClient={client}
      />,
    );

    await screen.findByRole("heading", { name: /main obs deck/i });

    fireEvent.click(screen.getByRole("button", { name: /mic/i }));
    fireEvent.click(screen.getByRole("button", { name: /gameplay/i }));

    await waitFor(() => {
      expect(client.calls).toEqual([
        { type: "toggleInputMute", inputName: "Mic/Aux" },
        { type: "setCurrentProgramScene", sceneName: "Gameplay" },
      ]);
    });
  });
});
