import {
  OBS_ACTION_TYPES,
  type DeckButtonAction,
  isDangerousDeckAction,
} from "../obs/types";

const AUDIO_ICONS = [
  "mic",
  "mic-off",
  "volume-2",
  "volume-x",
  "audio-lines",
  "audio-waveform",
  "headphones",
  "speaker",
] as const;

const VIDEO_ICONS = [
  "video",
  "video-off",
  "camera",
  "webcam",
  "eye",
  "eye-off",
  "scan-eye",
  "radio",
  "clapperboard",
  "monitor",
  "monitor-play",
  "image",
] as const;

const TRANSPORT_ICONS = [
  "play",
  "pause",
  "square",
  "circle-stop",
  "disc-3",
  "skip-back",
  "skip-forward",
  "rotate-ccw",
  "rotate-cw",
  "arrow-left",
  "arrow-right",
  "arrow-up",
  "arrow-down",
  "chevrons-left-right",
] as const;

const LAYOUT_ICONS = [
  "settings",
  "sliders-horizontal",
  "cog",
  "wrench",
  "layout-grid",
  "grid-3x3",
  "panels-top-left",
  "panel-top",
  "panel-left",
  "panel-right",
] as const;

const DEVICE_ICONS = [
  "laptop",
  "tablet-smartphone",
  "smartphone",
  "mouse-pointer-click",
  "hand",
  "sparkles",
  "zap",
  "triangle-alert",
  "circle-check-big",
] as const;

const STATUS_ICONS = [
  "info",
  "badge-alert",
  "shield-alert",
] as const;

export const WEBDECK_ICON_GROUPS = [
  { label: "Audio", icons: AUDIO_ICONS },
  { label: "Video & Scene", icons: VIDEO_ICONS },
  { label: "Transport & Toggle", icons: TRANSPORT_ICONS },
  { label: "Layout & Settings", icons: LAYOUT_ICONS },
  { label: "Devices & Utility", icons: DEVICE_ICONS },
  { label: "Status & Alert", icons: STATUS_ICONS },
] as const;

export const WEBDECK_ICON_ALLOWLIST = [
  ...AUDIO_ICONS,
  ...VIDEO_ICONS,
  ...TRANSPORT_ICONS,
  ...LAYOUT_ICONS,
  ...DEVICE_ICONS,
  ...STATUS_ICONS,
] as const;

export type WebdeckIconName = (typeof WEBDECK_ICON_ALLOWLIST)[number];
export const DECK_ICON_SIZES = ["sm", "md", "lg"] as const;
export type DeckIconSize = (typeof DECK_ICON_SIZES)[number];

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
  iconSize: DeckIconSize;
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
        iconSize: "md",
        color: "#dc2626",
        action: { type: "toggleInputMute", inputName: "Mic/Aux" },
      },
      {
        id: "scene-gameplay",
        slot: 1,
        label: "Gameplay",
        icon: { type: "lucide", name: "monitor" },
        iconSize: "md",
        color: "#0f766e",
        action: { type: "setCurrentProgramScene", sceneName: "Gameplay" },
      },
      {
        id: "camera-toggle",
        slot: 2,
        label: "Camera",
        icon: { type: "lucide", name: "video" },
        iconSize: "md",
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
        iconSize: "md",
        color: "#ea580c",
        action: { type: "startStream" },
      },
      {
        id: "record-pause",
        slot: 4,
        label: "Pause Rec",
        icon: { type: "lucide", name: "pause" },
        iconSize: "md",
        color: "#7c3aed",
        action: { type: "toggleRecordPause" },
      },
    ],
  };
}

export function normalizeDeckConfig(deck: DeckConfig): DeckConfig {
  return {
    ...deck,
    buttons: deck.buttons.map((button) => ({
      ...button,
      iconSize: button.iconSize ?? "md",
    })),
  };
}

export function getDeckSlotCount(grid: DeckGrid) {
  return grid.columns * grid.rows;
}

export {
  OBS_ACTION_TYPES,
  isDangerousDeckAction,
};
