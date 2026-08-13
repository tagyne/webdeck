import { createStore } from "zustand/vanilla";

import {
  createConnectionRepository,
  type ConnectionRepository,
} from "../db/connection-repository";
import type { ObsConnectionSettings } from "../features/obs/types";

type ConnectionStoreState = {
  connection?: ObsConnectionSettings;
  status: "idle" | "loading" | "ready" | "saving" | "error";
  error?: string;
  load: () => Promise<void>;
  save: (connection: ObsConnectionSettings) => Promise<void>;
};

export function createConnectionStore({
  repository = createConnectionRepository(),
}: {
  repository?: ConnectionRepository;
} = {}) {
  return createStore<ConnectionStoreState>()((set) => ({
    connection: undefined,
    status: "idle",
    error: undefined,
    async load() {
      set({ status: "loading", error: undefined });

      try {
        const connection = await repository.get();
        set({ connection, status: "ready" });
      } catch (error) {
        set({
          status: "error",
          error: error instanceof Error ? error.message : "Failed to load connection settings.",
        });
      }
    },
    async save(connection) {
      set({ status: "saving", error: undefined });

      try {
        await repository.save(connection);
        set({ connection, status: "ready" });
      } catch (error) {
        set({
          status: "error",
          error: error instanceof Error ? error.message : "Failed to save connection settings.",
        });
      }
    },
  }));
}

export const connectionStore = createConnectionStore();
