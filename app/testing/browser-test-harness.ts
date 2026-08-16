import { createConnectionStore } from "../stores/connection-store";
import { createDeckStore } from "../stores/deck-store";
import { createObsStore } from "../stores/obs-store";
import { FakeObsClient } from "../features/obs/fake-obs-client";
import type { ObsConnectionSettings, ObsState } from "../features/obs/types";
import type { DeckConfig } from "../features/deck/types";
import type { DeckButtonAction } from "../features/obs/types";

export type BrowserTestHarnessConfig = {
  connection?: ObsConnectionSettings;
  deck?: DeckConfig;
  connectErrorMessage?: string;
  obsState?: Partial<ObsState>;
};

export type BrowserTestHarnessRuntime = {
  clearCalls: () => void;
  getCalls: () => DeckButtonAction[];
  getDeck: () => DeckConfig | undefined;
  pushObsState: (partial: Partial<ObsState>) => void;
};

export type BrowserTestHarnessAppProps = {
  connectionStore: ReturnType<typeof createConnectionStore>;
  deckStore: ReturnType<typeof createDeckStore>;
  obsStore: ReturnType<typeof createObsStore>;
  obsClient: FakeObsClient;
};

declare global {
  interface Window {
    __WEBDECK_E2E__?: {
      config?: BrowserTestHarnessConfig;
      runtime?: BrowserTestHarnessRuntime;
    };
  }
}

let cachedHarnessProps: BrowserTestHarnessAppProps | undefined | null;

export function resetBrowserTestHarnessForTests() {
  cachedHarnessProps = undefined;
}

export function getBrowserTestHarnessProps(): BrowserTestHarnessAppProps | undefined {
  if (cachedHarnessProps !== undefined) {
    return cachedHarnessProps ?? undefined;
  }

  if (typeof window === "undefined" || !window.__WEBDECK_E2E__?.config) {
    cachedHarnessProps = null;
    return undefined;
  }

  const { connection, deck, connectErrorMessage, obsState } = window.__WEBDECK_E2E__.config;
  let savedConnection = connection;
  let savedDeck = deck;

  const obsClient = new FakeObsClient({ connectErrorMessage });
  if (obsState) {
    obsClient.pushState(obsState);
  }

  window.__WEBDECK_E2E__.runtime = {
    clearCalls() {
      obsClient.calls.length = 0;
    },
    getCalls() {
      return [...obsClient.calls];
    },
    getDeck() {
      return savedDeck;
    },
    pushObsState(partial) {
      obsClient.pushState(partial);
    },
  };

  cachedHarnessProps = {
    connectionStore: createConnectionStore({
      repository: {
        get: async () => savedConnection,
        save: async (nextConnection) => {
          savedConnection = nextConnection;
        },
      },
    }),
    deckStore: createDeckStore({
      repository: {
        get: async () => savedDeck,
        save: async (nextDeck) => {
          savedDeck = nextDeck;
        },
      },
    }),
    obsStore: createObsStore(),
    obsClient,
  };

  return cachedHarnessProps;
}
