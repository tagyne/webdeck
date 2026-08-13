import {
  DEFAULT_DECK_CONFIG,
  DEFAULT_DECK_GRID,
  getDeckSlotCount,
  OBS_ACTION_TYPES,
  WEBDECK_ICON_ALLOWLIST,
  isDangerousDeckAction,
} from "../app/features/deck/types";

describe("deck contracts", () => {
  it("uses a default 3x3 grid", () => {
    expect(DEFAULT_DECK_GRID).toEqual({ columns: 3, rows: 3 });
    expect(DEFAULT_DECK_CONFIG.grid).toEqual(DEFAULT_DECK_GRID);
    expect(getDeckSlotCount(DEFAULT_DECK_CONFIG.grid)).toBe(9);
  });

  it("exposes the supported action families for v1", () => {
    expect(OBS_ACTION_TYPES).toEqual([
      "toggleInputMute",
      "setCurrentProgramScene",
      "toggleSourceVisibility",
      "startStream",
      "stopStream",
      "toggleRecordPause",
    ]);
  });

  it("keeps the curated lucide icon list available to the editor and validation", () => {
    expect(WEBDECK_ICON_ALLOWLIST).toContain("mic");
    expect(WEBDECK_ICON_ALLOWLIST).toContain("radio");
    expect(WEBDECK_ICON_ALLOWLIST).not.toContain("banana");
  });

  it("marks only stop-stream as a dangerous v1 action", () => {
    expect(isDangerousDeckAction({ type: "stopStream" })).toBe(true);
    expect(isDangerousDeckAction({ type: "startStream" })).toBe(false);
    expect(
      isDangerousDeckAction({
        type: "toggleSourceVisibility",
        sceneName: "Main",
        sourceName: "Camera",
      }),
    ).toBe(false);
  });
});
