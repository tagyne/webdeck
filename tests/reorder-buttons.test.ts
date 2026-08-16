import { describe, expect, it } from "vitest";

import { reorderDeckButtons } from "../app/features/deck/reorder-buttons";
import { createStarterDeckConfig } from "../app/features/deck/types";

describe("reorderDeckButtons", () => {
  it("reassigns slots to match the dragged order", () => {
    const deck = createStarterDeckConfig();

    const nextDeck = reorderDeckButtons({
      deck,
      activeButtonId: "start-stream",
      overButtonId: "mute-mic",
    });

    expect(nextDeck.buttons.map((button) => [button.id, button.slot])).toEqual([
      ["start-stream", 0],
      ["mute-mic", 1],
      ["scene-gameplay", 2],
      ["camera-toggle", 3],
      ["record-pause", 4],
    ]);
  });

  it("returns the same deck when drag ids are invalid", () => {
    const deck = createStarterDeckConfig();

    expect(reorderDeckButtons({
      deck,
      activeButtonId: "unknown",
      overButtonId: "mute-mic",
    })).toBe(deck);
  });
});
