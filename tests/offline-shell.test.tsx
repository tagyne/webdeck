import { render, screen, waitFor } from "@testing-library/react";

import { WebdeckApp } from "../app/routes/_index";
import { createStarterDeckConfig } from "../app/features/deck/types";
import { FakeObsClient } from "../app/features/obs/fake-obs-client";
import { createConnectionStore } from "../app/stores/connection-store";
import { createDeckStore } from "../app/stores/deck-store";
import { createObsStore } from "../app/stores/obs-store";

describe("offline shell", () => {
  it("shows the saved deck UI and disconnected OBS state when reconnect fails on startup", async () => {
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
        obsClient={new FakeObsClient({
          connectErrorMessage: "OBS is offline on the local network.",
        })}
      />,
    );

    await screen.findByRole("heading", { name: /main obs deck/i });

    await waitFor(() => {
      expect(screen.getByText(/^Disconnected$/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/obs connection lost/i)).toBeInTheDocument();
    expect(screen.getByText(/obs is offline on the local network/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /slot 1: mic/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /slot 2: gameplay/i })).toBeInTheDocument();
  });
});
