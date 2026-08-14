import type { DeckButton } from "./types";
import type { ObsState } from "../obs/types";
import { toSourceKey } from "../obs/obs-client";

export function getDeckButtonStateMeta(button: DeckButton, obsState: ObsState) {
  switch (button.action.type) {
    case "toggleInputMute":
      return {
        isToggle: true,
        isActive: !obsState.mutedInputs[button.action.inputName],
        isDisabled: false,
      };
    case "setCurrentProgramScene":
      return {
        isToggle: true,
        isActive: obsState.activeSceneName === button.action.sceneName,
        isDisabled: false,
      };
    case "toggleSourceVisibility": {
      const visible = obsState.visibleSources[toSourceKey(button.action.sceneName, button.action.sourceName)];
      return {
        isToggle: true,
        isActive: visible !== false,
        isDisabled: false,
      };
    }
    case "startStream":
      return {
        isToggle: false,
        isActive: false,
        isDisabled: obsState.isStreaming,
      };
    case "stopStream":
      return {
        isToggle: false,
        isActive: false,
        isDisabled: !obsState.isStreaming,
      };
    case "toggleRecordPause":
      return {
        isToggle: true,
        isActive: obsState.isRecordPaused,
        isDisabled: false,
      };
  }
}
