import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { WebdeckApp } from "../app/routes/_index";
import { createStarterDeckConfig } from "../app/features/deck/types";
import { FakeObsClient } from "../app/features/obs/fake-obs-client";
import { createConnectionStore } from "../app/stores/connection-store";
import { createDeckStore } from "../app/stores/deck-store";
import { createObsStore } from "../app/stores/obs-store";

describe("OBS state feedback", () => {
  it("shows live button state and streaming status from obs events", async () => {
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
            get: async () => createStarterDeckConfig(),
            save: async () => undefined,
          },
        })}
        obsStore={createObsStore()}
        obsClient={client}
      />,
    );

    await screen.findByRole("button", { name: /edit deck/i });

    await act(async () => {
      await client.connect({ host: "192.168.1.20", port: 4455 });
      await client.toggleInputMute("Mic/Aux");
      await client.startStream();
    });

    await waitFor(() => {
      expect(screen.getByText(/stream live \/ record ready/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/^Muted$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Live$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Connected$/i)).toBeInTheDocument();
  });

  it("shows a visible disconnect state and does not imply success after connection loss", async () => {
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
            get: async () => createStarterDeckConfig(),
            save: async () => undefined,
          },
        })}
        obsStore={createObsStore()}
        obsClient={client}
      />,
    );

    await screen.findByRole("button", { name: /edit deck/i });
    await act(async () => {
      await client.connect({ host: "192.168.1.20", port: 4455 });
      await client.disconnect();
    });

    expect(await screen.findByText(/obs connection lost/i)).toBeInTheDocument();
    expect(screen.getByText(/^Disconnected$/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /slot 1: mic/i }));

    await waitFor(() => {
      expect(screen.getByText(/actions are paused until obs reconnects/i)).toBeInTheDocument();
    });
  });

  it("offers a reconnect path that restores the saved OBS session", async () => {
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
            get: async () => createStarterDeckConfig(),
            save: async () => undefined,
          },
        })}
        obsStore={createObsStore()}
        obsClient={client}
      />,
    );

    await screen.findByRole("button", { name: /edit deck/i });
    await act(async () => {
      await client.connect({ host: "192.168.1.20", port: 4455 });
      await client.disconnect();
    });

    fireEvent.click(await screen.findByRole("button", { name: /reconnect obs/i }));

    await waitFor(() => {
      expect(screen.getByText(/^Connected$/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/obs connection lost/i)).not.toBeInTheDocument();
  });

  it("renders a floating profile dock and switches the OBS profile", async () => {
    const client = new FakeObsClient();
    client.pushState({
      profileNames: ["Gaming", "Streaming", "Podcast"],
      currentProfileName: "Gaming",
    });

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
        obsClient={client}
      />,
    );

    await screen.findByRole("tab", { name: /gaming/i });
    expect(screen.getByRole("tab", { name: /gaming/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /streaming/i })).toHaveAttribute("aria-selected", "false");

    fireEvent.click(screen.getByRole("tab", { name: /streaming/i }));

    await waitFor(() => {
      expect(client.state.currentProfileName).toBe("Streaming");
    });

    expect(screen.getByRole("tab", { name: /streaming/i })).toHaveAttribute("aria-selected", "true");
  });
});
