import { createConnectionStore } from "../app/stores/connection-store";
import { createDeckStore } from "../app/stores/deck-store";
import { createObsStore } from "../app/stores/obs-store";
import { DEFAULT_DECK_CONFIG } from "../app/features/deck/types";

describe("session stores", () => {
  it("hydrates and saves deck data through the repository", async () => {
    let savedName = "";

    const deckStore = createDeckStore({
      repository: {
        get: async () => ({ ...DEFAULT_DECK_CONFIG, name: "Saved Deck" }),
        save: async (deck) => {
          savedName = deck.name;
        },
      },
    });

    await deckStore.getState().load();
    expect(deckStore.getState().deck?.name).toBe("Saved Deck");

    await deckStore.getState().save({
      ...DEFAULT_DECK_CONFIG,
      name: "Edited Deck",
    });

    expect(savedName).toBe("Edited Deck");
  });

  it("hydrates and saves connection settings through the repository", async () => {
    let savedHost = "";

    const connectionStore = createConnectionStore({
      repository: {
        get: async () => ({
          host: "192.168.1.20",
          port: 4455,
        }),
        save: async (connection) => {
          savedHost = connection.host;
        },
      },
    });

    await connectionStore.getState().load();
    expect(connectionStore.getState().connection?.host).toBe("192.168.1.20");

    await connectionStore.getState().save({
      host: "192.168.1.21",
      port: 4455,
      password: "secret",
    });

    expect(savedHost).toBe("192.168.1.21");
  });

  it("tracks OBS connection and live state without persistence middleware", () => {
    const obsStore = createObsStore();

    obsStore.getState().setConnectionStatus("connected");
    obsStore.getState().setStreaming(true);
    obsStore.getState().setRecordPaused(true);
    obsStore.getState().setMuted("Mic/Aux", true);

    expect(obsStore.getState().connectionStatus).toBe("connected");
    expect(obsStore.getState().isStreaming).toBe(true);
    expect(obsStore.getState().isRecordPaused).toBe(true);
    expect(obsStore.getState().mutedInputs["Mic/Aux"]).toBe(true);
  });
});
