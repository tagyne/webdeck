import { createStarterDeckConfig } from "../app/features/deck/types";
import {
  getBrowserTestHarnessProps,
  resetBrowserTestHarnessForTests,
} from "../app/testing/browser-test-harness";

describe("browser test harness", () => {
  beforeEach(() => {
    delete window.__WEBDECK_E2E__;
    resetBrowserTestHarnessForTests();
  });

  it("stays disabled when no browser harness config is present", () => {
    expect(getBrowserTestHarnessProps()).toBeUndefined();
  });

  it("creates in-memory app services and exposes fake obs runtime controls", async () => {
    const starterDeck = createStarterDeckConfig();

    window.__WEBDECK_E2E__ = {
      config: {
        connection: { host: "192.168.1.20", port: 4455 },
        deck: starterDeck,
        obsState: { isStreaming: true },
      },
    };

    const harness = getBrowserTestHarnessProps();

    expect(harness).toBeDefined();

    await harness!.connectionStore.getState().load();
    await harness!.deckStore.getState().load();

    expect(harness!.connectionStore.getState().connection?.host).toBe("192.168.1.20");
    expect(harness!.deckStore.getState().deck?.name).toBe(starterDeck.name);
    expect(window.__WEBDECK_E2E__?.runtime?.getCalls()).toEqual([]);
    expect(window.__WEBDECK_E2E__?.runtime?.getDeck()?.buttons).toEqual(starterDeck.buttons);

    await harness!.obsClient.startStream();
    expect(window.__WEBDECK_E2E__?.runtime?.getCalls()).toEqual([{ type: "startStream" }]);

    window.__WEBDECK_E2E__?.runtime?.clearCalls();
    expect(window.__WEBDECK_E2E__?.runtime?.getCalls()).toEqual([]);

    await harness!.deckStore.getState().save({
      ...starterDeck,
      name: "Reordered Deck",
    });
    expect(window.__WEBDECK_E2E__?.runtime?.getDeck()?.name).toBe("Reordered Deck");

    window.__WEBDECK_E2E__?.runtime?.pushObsState({ isRecordPaused: true });
    expect(harness!.obsClient.state.isRecordPaused).toBe(true);
  });
});
