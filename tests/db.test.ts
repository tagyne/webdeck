import {
  createDeckRepository,
  createPreferencesRepository,
} from "../app/db/deck-repository";
import { createConnectionRepository } from "../app/db/connection-repository";
import { createWebdeckDatabase } from "../app/db/database";
import { DEFAULT_DECK_CONFIG } from "../app/features/deck/types";

describe("Dexie repositories", () => {
  it("creates, loads, and replaces saved deck data", async () => {
    const db = createWebdeckDatabase("webdeck-db-test-1");
    const deckRepository = createDeckRepository(db);

    await deckRepository.save({
      ...DEFAULT_DECK_CONFIG,
      updatedAt: "2026-08-13T12:00:00.000Z",
    });

    const loaded = await deckRepository.get();
    expect(loaded?.name).toBe("Main OBS Deck");

    await deckRepository.save({
      ...DEFAULT_DECK_CONFIG,
      name: "Travel Deck",
      updatedAt: "2026-08-13T12:30:00.000Z",
    });

    const replaced = await deckRepository.get();
    expect(replaced?.name).toBe("Travel Deck");

    await db.delete();
  });

  it("saves and loads connection settings", async () => {
    const db = createWebdeckDatabase("webdeck-db-test-2");
    const connectionRepository = createConnectionRepository(db);

    await connectionRepository.save({
      host: "192.168.1.20",
      port: 4455,
      password: "secret",
    });

    const loaded = await connectionRepository.get();
    expect(loaded).toEqual({
      host: "192.168.1.20",
      port: 4455,
      password: "secret",
    });

    await db.delete();
  });

  it("saves and loads app preferences", async () => {
    const db = createWebdeckDatabase("webdeck-db-test-3");
    const preferencesRepository = createPreferencesRepository(db);

    await preferencesRepository.save({
      confirmDangerousActions: true,
    });

    await expect(preferencesRepository.get()).resolves.toEqual({
      confirmDangerousActions: true,
    });

    await db.delete();
  });
});
