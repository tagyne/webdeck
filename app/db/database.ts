import Dexie, { type EntityTable } from "dexie";

import type { DeckConfig } from "../features/deck/types";
import type { ObsConnectionSettings } from "../features/obs/types";

export type PreferencesRecord = {
  id: "app";
  confirmDangerousActions: boolean;
};

export type ConnectionRecord = ObsConnectionSettings & {
  id: "primary";
};

export class WebdeckDatabase extends Dexie {
  decks!: EntityTable<DeckConfig, "id">;
  connectionSettings!: EntityTable<ConnectionRecord, "id">;
  preferences!: EntityTable<PreferencesRecord, "id">;

  constructor(name = "WebdeckDatabase") {
    super(name);

    this.version(1).stores({
      decks: "id, updatedAt",
      connectionSettings: "id, host, port",
      preferences: "id",
    });
  }
}

export function createWebdeckDatabase(name?: string) {
  return new WebdeckDatabase(name);
}

export const db = createWebdeckDatabase();
