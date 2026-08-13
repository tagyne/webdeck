export const OBS_ACTION_TYPES = [
  "toggleInputMute",
  "setCurrentProgramScene",
  "toggleSourceVisibility",
  "startStream",
  "stopStream",
  "toggleRecordPause",
] as const;

export type ObsActionType = (typeof OBS_ACTION_TYPES)[number];

export type ToggleInputMuteAction = {
  type: "toggleInputMute";
  inputName: string;
};

export type SetCurrentProgramSceneAction = {
  type: "setCurrentProgramScene";
  sceneName: string;
};

export type ToggleSourceVisibilityAction = {
  type: "toggleSourceVisibility";
  sceneName: string;
  sourceName: string;
};

export type StartStreamAction = {
  type: "startStream";
};

export type StopStreamAction = {
  type: "stopStream";
};

export type ToggleRecordPauseAction = {
  type: "toggleRecordPause";
};

export type DeckButtonAction =
  | ToggleInputMuteAction
  | SetCurrentProgramSceneAction
  | ToggleSourceVisibilityAction
  | StartStreamAction
  | StopStreamAction
  | ToggleRecordPauseAction;

export type ObsConnectionSettings = {
  host: string;
  port: number;
  password?: string;
};

export type ObsConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type ObsState = {
  connectionStatus: ObsConnectionStatus;
  activeSceneName?: string;
  mutedInputs: Record<string, boolean>;
  visibleSources: Record<string, boolean>;
  isStreaming: boolean;
  isRecordPaused: boolean;
  lastError?: string;
};

export function isDangerousDeckAction(action: DeckButtonAction) {
  return action.type === "stopStream";
}
