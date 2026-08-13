import { createStore } from "zustand/vanilla";

import { createDeckRepository, type DeckRepository } from "../db/deck-repository";
import type { DeckConfig } from "../features/deck/types";

type DeckStoreState = {
  deck?: DeckConfig;
  status: "idle" | "loading" | "ready" | "saving" | "error";
  error?: string;
  load: () => Promise<void>;
  save: (deck: DeckConfig) => Promise<void>;
};

export function createDeckStore({
  repository = createDeckRepository(),
}: {
  repository?: DeckRepository;
} = {}) {
  return createStore<DeckStoreState>()((set) => ({
    deck: undefined,
    status: "idle",
    error: undefined,
    async load() {
      set({ status: "loading", error: undefined });

      try {
        const deck = await repository.get();
        set({ deck, status: "ready" });
      } catch (error) {
        set({
          status: "error",
          error: error instanceof Error ? error.message : "Failed to load deck.",
        });
      }
    },
    async save(deck) {
      set({ status: "saving", error: undefined });

      try {
        await repository.save(deck);
        set({ deck, status: "ready" });
      } catch (error) {
        set({
          status: "error",
          error: error instanceof Error ? error.message : "Failed to save deck.",
        });
      }
    },
  }));
}

export const deckStore = createDeckStore();
