import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { WebdeckApp } from "../app/routes/_index";
import { createStarterDeckConfig, WEBDECK_ICON_ALLOWLIST } from "../app/features/deck/types";
import { createConnectionStore } from "../app/stores/connection-store";
import { createDeckStore } from "../app/stores/deck-store";
import { createObsStore } from "../app/stores/obs-store";
import { FakeObsClient } from "../app/features/obs/fake-obs-client";

describe("button editor", () => {
  it("validates required action fields and only exposes curated icons", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: /edit deck/i }));
    fireEvent.click(screen.getByRole("button", { name: /slot 6/i }));

    const panel = await screen.findByRole("region", { name: /edit slot 6/i });
    const iconSelect = within(panel).getByLabelText(/icon/i) as HTMLSelectElement;
    const actionSelect = within(panel).getByLabelText(/action type/i) as HTMLSelectElement;

    expect(iconSelect.options).toHaveLength(WEBDECK_ICON_ALLOWLIST.length);
    expect(
      Array.from(iconSelect.options).some((option) => option.value === "banana"),
    ).toBe(false);

    fireEvent.change(within(panel).getByLabelText(/label/i), {
      target: { value: "Camera Toggle" },
    });
    fireEvent.change(actionSelect, {
      target: { value: "toggleSourceVisibility" },
    });
    fireEvent.click(within(panel).getByRole("button", { name: /save button/i }));

    expect(await within(panel).findByText(/scene name is required/i)).toBeInTheDocument();
    expect(within(panel).getByText(/source name is required/i)).toBeInTheDocument();
  });

  it("saves slot changes through the deck store", async () => {
    let savedDeck = createStarterDeckConfig();

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
            save: async (deck) => {
              savedDeck = deck;
            },
          },
        })}
        obsStore={createObsStore()}
        obsClient={new FakeObsClient()}
      />,
    );

    await screen.findByRole("heading", { name: /main obs deck/i });
    fireEvent.click(screen.getByRole("button", { name: /edit deck/i }));
    fireEvent.click(screen.getByRole("button", { name: /slot 6/i }));

    const panel = await screen.findByRole("region", { name: /edit slot 6/i });

    fireEvent.change(within(panel).getByLabelText(/label/i), {
      target: { value: "BRB" },
    });
    fireEvent.change(within(panel).getByLabelText(/icon/i), {
      target: { value: "radio" },
    });
    fireEvent.change(within(panel).getByLabelText(/action type/i), {
      target: { value: "startStream" },
    });
    fireEvent.click(within(panel).getByRole("button", { name: /save button/i }));

    await waitFor(() => {
      expect(screen.queryByRole("region", { name: /edit slot 6/i })).not.toBeInTheDocument();
    });

    expect(savedDeck.buttons.find((button) => button.slot === 5)?.label).toBe("BRB");
    expect(savedDeck.buttons.find((button) => button.slot === 5)?.icon.name).toBe("radio");
    expect(savedDeck.buttons.find((button) => button.slot === 5)?.action.type).toBe("startStream");
    expect(screen.getByRole("button", { name: /exit edit deck/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /slot 6: brb/i })).toBeInTheDocument();
  });

  it("marks deck buttons as editable while edit mode is active", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: /edit deck/i }));

    expect(screen.getAllByText("Edit").length).toBeGreaterThan(0);
    expect(screen.getByText(/tap to add a button/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete button in slot 1/i })).toBeInTheDocument();
  });

  it("supports deleting a button from the tile shortcut in edit mode", async () => {
    let savedDeck = createStarterDeckConfig();

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
            save: async (deck) => {
              savedDeck = deck;
            },
          },
        })}
        obsStore={createObsStore()}
        obsClient={new FakeObsClient()}
      />,
    );

    await screen.findByRole("heading", { name: /main obs deck/i });
    fireEvent.click(screen.getByRole("button", { name: /edit deck/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete button in slot 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm delete button in slot 1/i }));

    await waitFor(() => {
      expect(savedDeck.buttons.find((button) => button.slot === 0)).toBeUndefined();
    });
  });
});
