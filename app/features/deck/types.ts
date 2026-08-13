import {
  OBS_ACTION_TYPES,
  type DeckButtonAction,
  isDangerousDeckAction,
} from "../obs/types";

export const WEBDECK_ICON_ALLOWLIST = [
  "mic",
  "mic-off",
  "volume-2",
  "volume-x",
  "video",
  "video-off",
  "eye",
  "eye-off",
  "radio",
  "play",
  "pause",
  "square",
  "clapperboard",
  "monitor",
  "image",
  "settings",
  "triangle-alert",
  "circle-check-big",
] as const;

export type WebdeckIconName = (typeof WEBDECK_ICON_ALLOWLIST)[number];

export type IconRef = {
  type: "lucide";
  name: WebdeckIconName;
};

export type DeckGrid = {
  columns: number;
  rows: number;
};

export type DeckButton = {
  id: string;
  slot: number;
  label: string;
  icon: IconRef;
  color: string;
  action: DeckButtonAction;
};

export type DeckConfig = {
  id: string;
  name: string;
  grid: DeckGrid;
  buttons: DeckButton[];
  updatedAt: string;
};

export const DEFAULT_DECK_GRID: DeckGrid = {
  columns: 3,
  rows: 3,
};

export const DEFAULT_DECK_CONFIG: DeckConfig = {
  id: "main-deck",
  name: "Main OBS Deck",
  grid: DEFAULT_DECK_GRID,
  buttons: [],
  updatedAt: new Date(0).toISOString(),
};

export function createStarterDeckConfig(): DeckConfig {
  return {
    ...DEFAULT_DECK_CONFIG,
    updatedAt: "2026-08-13T12:00:00.000Z",
    buttons: [
      {
        id: "mute-mic",
        slot: 0,
        label: "Mic",
        icon: { type: "lucide", name: "mic" },
        color: "#dc2626",
        action: { type: "toggleInputMute", inputName: "Mic/Aux" },
      },
      {
        id: "scene-gameplay",
        slot: 1,
        label: "Gameplay",
        icon: { type: "lucide", name: "monitor" },
        color: "#0f766e",
        action: { type: "setCurrentProgramScene", sceneName: "Gameplay" },
      },
      {
        id: "camera-toggle",
        slot: 2,
        label: "Camera",
        icon: { type: "lucide", name: "video" },
        color: "#2563eb",
        action: {
          type: "toggleSourceVisibility",
          sceneName: "Gameplay",
          sourceName: "Camera",
        },
      },
      {
        id: "start-stream",
        slot: 3,
        label: "Go Live",
        icon: { type: "lucide", name: "radio" },
        color: "#ea580c",
        action: { type: "startStream" },
      },
      {
        id: "record-pause",
        slot: 4,
        label: "Pause Rec",
        icon: { type: "lucide", name: "pause" },
        color: "#7c3aed",
        action: { type: "toggleRecordPause" },
      },
    ],
  };
}

export function getDeckSlotCount(grid: DeckGrid) {
  return grid.columns * grid.rows;
}

export {
  OBS_ACTION_TYPES,
  isDangerousDeckAction,
};
