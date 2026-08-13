import type { DeckButton } from "./types";
import type { ObsState } from "../obs/types";
import { toSourceKey } from "../obs/obs-client";

export function getDeckButtonStateLabel(button: DeckButton, obsState: ObsState) {
  switch (button.action.type) {
    case "toggleInputMute":
      return obsState.mutedInputs[button.action.inputName] ? "Muted" : "Live";
    case "setCurrentProgramScene":
      return obsState.activeSceneName === button.action.sceneName ? "Active" : "Ready";
    case "toggleSourceVisibility": {
      const visible = obsState.visibleSources[toSourceKey(button.action.sceneName, button.action.sourceName)];
      return visible === false ? "Hidden" : "Visible";
    }
    case "startStream":
    case "stopStream":
      return obsState.isStreaming ? "Live" : "Offline";
    case "toggleRecordPause":
      return obsState.isRecordPaused ? "Paused" : "Recording";
  }
}
