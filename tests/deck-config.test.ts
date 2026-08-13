import {
  DeckConfigValidationError,
  parseWebdeckImport,
  serializeWebdeckExport,
} from "../app/features/deck/import-export";

import type { WebdeckExport } from "../app/features/deck/config-schema";

function createValidExport(): WebdeckExport {
  return {
    schemaVersion: 1,
    app: "webdeck",
    exportedAt: "2026-08-13T12:00:00.000Z",
    deck: {
      id: "main-deck",
      name: "Main OBS Deck",
      grid: {
        columns: 3,
        rows: 3,
      },
      buttons: [
        {
          id: "mute-mic",
          slot: 0,
          label: "Mic",
          icon: {
            type: "lucide",
            name: "mic",
          },
          color: "#ef4444",
          action: {
            type: "toggleInputMute",
            inputName: "Mic/Aux",
          },
        },
      ],
      updatedAt: "2026-08-13T12:00:00.000Z",
    },
    connection: {
      host: "192.168.1.20",
      port: 4455,
      includePassword: false,
    },
  };
}

describe("webdeck import/export", () => {
  it("parses a valid v1 export into typed app data", () => {
    const parsed = parseWebdeckImport(createValidExport());

    expect(parsed.deck.grid).toEqual({ columns: 3, rows: 3 });
    expect(parsed.deck.buttons).toHaveLength(1);
    expect(parsed.deck.buttons[0]?.action.type).toBe("toggleInputMute");
    expect(parsed.connection?.password).toBeUndefined();
  });

  it("rejects an unsupported schema version", () => {
    expect(() =>
      parseWebdeckImport({
        ...createValidExport(),
        schemaVersion: 2,
      }),
    ).toThrowError(DeckConfigValidationError);
  });

  it("rejects duplicate button ids", () => {
    const duplicate = createValidExport();
    duplicate.deck.buttons.push({
      ...duplicate.deck.buttons[0]!,
      slot: 1,
    });

    expect(() => parseWebdeckImport(duplicate)).toThrowError(/duplicate button id/i);
  });

  it("rejects buttons outside the configured grid", () => {
    const invalid = createValidExport();
    invalid.deck.buttons[0] = {
      ...invalid.deck.buttons[0]!,
      slot: 9,
    };

    expect(() => parseWebdeckImport(invalid)).toThrowError(/slot 9 is outside/i);
  });

  it("rejects unsupported lucide icons", () => {
    const invalid = createValidExport();
    invalid.deck.buttons[0] = {
      ...invalid.deck.buttons[0]!,
      icon: {
        type: "lucide",
        name: "banana",
      },
    };

    expect(() => parseWebdeckImport(invalid)).toThrowError(/unsupported icon/i);
  });

  it("rejects actions with missing required fields", () => {
    const invalid = createValidExport();
    invalid.deck.buttons[0] = {
      ...invalid.deck.buttons[0]!,
      action: {
        type: "toggleSourceVisibility",
        sceneName: "Gameplay",
      } as never,
    };

    expect(() => parseWebdeckImport(invalid)).toThrowError(/sourceName is required/i);
  });

  it("exports stable human-readable json without password by default", () => {
    const json = serializeWebdeckExport({
      deck: createValidExport().deck,
      connection: {
        host: "192.168.1.20",
        port: 4455,
        password: "super-secret",
      },
    });

    expect(json.endsWith("\n")).toBe(true);
    expect(json).toContain('"schemaVersion": 1');
    expect(json).toContain('"includePassword": false');
    expect(json).not.toContain("super-secret");
  });
});
