import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { createConnectionStore } from "../app/stores/connection-store";
import { createDeckStore } from "../app/stores/deck-store";
import { createObsStore } from "../app/stores/obs-store";
import { DEFAULT_DECK_CONFIG } from "../app/features/deck/types";
import { FakeObsClient } from "../app/features/obs/fake-obs-client";
import { WebdeckApp } from "../app/routes/_index";

describe("first-launch connection setup", () => {
  it("shows setup when no saved connection exists", async () => {
    const connectionStore = createConnectionStore({
      repository: {
        get: async () => undefined,
        save: async () => undefined,
      },
    });
    const deckStore = createDeckStore({
      repository: {
        get: async () => DEFAULT_DECK_CONFIG,
        save: async () => undefined,
      },
    });

    render(
      <WebdeckApp
        connectionStore={connectionStore}
        deckStore={deckStore}
        obsStore={createObsStore()}
        obsClient={new FakeObsClient()}
      />,
    );

    expect(await screen.findByRole("heading", { name: /connect to obs/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/host/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/port/i)).toBeInTheDocument();
  });

  it("saves settings after a successful connection and moves to the deck", async () => {
    let savedConnectionHost = "";

    const connectionStore = createConnectionStore({
      repository: {
        get: async () => undefined,
        save: async (connection) => {
          savedConnectionHost = connection.host;
        },
      },
    });
    const deckStore = createDeckStore({
      repository: {
        get: async () => DEFAULT_DECK_CONFIG,
        save: async () => undefined,
      },
    });

    render(
      <WebdeckApp
        connectionStore={connectionStore}
        deckStore={deckStore}
        obsStore={createObsStore()}
        obsClient={new FakeObsClient()}
      />,
    );

    fireEvent.change(await screen.findByLabelText(/host/i), {
      target: { value: "192.168.1.20" },
    });
    fireEvent.change(screen.getByLabelText(/port/i), {
      target: { value: "4455" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /connect obs/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /main obs deck/i })).toBeInTheDocument();
    });

    expect(savedConnectionHost).toBe("192.168.1.20");
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
  });

  it("keeps the form editable and shows a specific error when connection fails", async () => {
    const failingClient = new FakeObsClient({
      connectErrorMessage: "OBS rejected the password.",
    });

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
        obsClient={failingClient}
      />,
    );

    fireEvent.change(await screen.findByLabelText(/host/i), {
      target: { value: "192.168.1.20" },
    });
    fireEvent.change(screen.getByLabelText(/port/i), {
      target: { value: "4455" },
    });
    fireEvent.click(screen.getByRole("button", { name: /connect obs/i }));

    expect(await screen.findByText(/obs rejected the password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/host/i)).toHaveValue("192.168.1.20");
  });
});
