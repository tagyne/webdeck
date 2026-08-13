import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { WebdeckApp } from "../app/routes/_index";
import { createStarterDeckConfig } from "../app/features/deck/types";
import { createConnectionStore } from "../app/stores/connection-store";
import { createDeckStore } from "../app/stores/deck-store";
import { createObsStore } from "../app/stores/obs-store";
import { FakeObsClient } from "../app/features/obs/fake-obs-client";

function createImportFile() {
  return new File(
    [
      JSON.stringify(
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
      ),
    ],
    "travel-deck.webdeck.json",
    { type: "application/json" },
  );
}

describe("import/export panel", () => {
  it("exports the current deck as a .webdeck.json download", async () => {
    let clickedDownload = "";
    let blobPayload = "";

    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockImplementation((blob) => {
        void blob.text().then((text) => {
          blobPayload = text;
        });
        return "blob:download";
      });
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function click() {
        clickedDownload = this.download;
      });

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
    fireEvent.click(screen.getByRole("button", { name: /import \/ export/i }));
    fireEvent.click(screen.getByRole("button", { name: /export deck/i }));

    await waitFor(() => {
      expect(clickedDownload).toMatch(/\.webdeck\.json$/);
    });

    expect(blobPayload).toContain('"app": "webdeck"');
    expect(blobPayload).toContain('"includePassword": false');

    clickSpy.mockRestore();
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });

  it("shows an import preview before replacing saved state", async () => {
    let savedDeckName = "";
    let savedConnectionHost = "";

    render(
      <WebdeckApp
        connectionStore={createConnectionStore({
          repository: {
            get: async () => ({
              host: "192.168.1.20",
              port: 4455,
            }),
            save: async (connection) => {
              savedConnectionHost = connection.host;
            },
          },
        })}
        deckStore={createDeckStore({
          repository: {
            get: async () => createStarterDeckConfig(),
            save: async (deck) => {
              savedDeckName = deck.name;
            },
          },
        })}
        obsStore={createObsStore()}
        obsClient={new FakeObsClient()}
      />,
    );

    await screen.findByRole("heading", { name: /main obs deck/i });
    fireEvent.click(screen.getByRole("button", { name: /import \/ export/i }));

    const input = screen.getByLabelText(/import deck file/i);
    fireEvent.change(input, {
      target: { files: [createImportFile()] },
    });

    const preview = await screen.findByRole("dialog", { name: /import preview/i });
    expect(within(preview).getByText(/travel deck/i)).toBeInTheDocument();
    expect(within(preview).getByText(/3 x 3/i)).toBeInTheDocument();
    expect(within(preview).getByText(/1 configured button/i)).toBeInTheDocument();
    expect(within(preview).getByText(/connection settings included/i)).toBeInTheDocument();

    expect(savedDeckName).toBe("");
    expect(savedConnectionHost).toBe("");

    fireEvent.click(within(preview).getByRole("button", { name: /replace current deck/i }));

    await waitFor(() => {
      expect(savedDeckName).toBe("Travel Deck");
    });

    expect(savedConnectionHost).toBe("192.168.1.44");
    expect(screen.getByText(/192\.168\.1\.44:4455/i)).toBeInTheDocument();
  });

  it("shows invalid import errors without replacing saved state", async () => {
    let deckSaveCalls = 0;

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
            save: async () => {
              deckSaveCalls += 1;
            },
          },
        })}
        obsStore={createObsStore()}
        obsClient={new FakeObsClient()}
      />,
    );

    await screen.findByRole("heading", { name: /main obs deck/i });
    fireEvent.click(screen.getByRole("button", { name: /import \/ export/i }));

    const invalidFile = new File(
      [
        JSON.stringify({
          schemaVersion: 99,
          app: "webdeck",
          exportedAt: "2026-08-13T12:00:00.000Z",
          deck: {
            name: "Broken",
            grid: { columns: 3, rows: 3 },
            buttons: [],
          },
        }),
      ],
      "broken.webdeck.json",
      { type: "application/json" },
    );

    fireEvent.change(screen.getByLabelText(/import deck file/i), {
      target: { files: [invalidFile] },
    });

    expect(await screen.findByText(/unsupported schema version/i)).toBeInTheDocument();
    expect(deckSaveCalls).toBe(0);
  });
});
