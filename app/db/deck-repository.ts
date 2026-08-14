import { db, type PreferencesRecord, type WebdeckDatabase } from "./database";
import { normalizeDeckConfig, type DeckConfig } from "../features/deck/types";

export type DeckRepository = {
  get: (id?: string) => Promise<DeckConfig | undefined>;
  save: (deck: DeckConfig) => Promise<void>;
};

export type PreferencesRepository = {
  get: () => Promise<Omit<PreferencesRecord, "id"> | undefined>;
  save: (preferences: Omit<PreferencesRecord, "id">) => Promise<void>;
};

export function createDeckRepository(database: WebdeckDatabase = db): DeckRepository {
  return {
    async get(id = "main-deck") {
      const deck = await database.decks.get(id);
      return deck ? normalizeDeckConfig(deck) : undefined;
    },
    async save(deck) {
      await database.decks.put(normalizeDeckConfig(deck));
    },
  };
}

export function createPreferencesRepository(
  database: WebdeckDatabase = db,
): PreferencesRepository {
  return {
    async get() {
      const record = await database.preferences.get("app");
      if (!record) {
        return undefined;
      }

      return {
        confirmDangerousActions: record.confirmDangerousActions,
      };
    },
    async save(preferences) {
      await database.preferences.put({
        id: "app",
        ...preferences,
      });
    },
  };
}
