import OBSWebSocket, {
  EventSubscription,
  type OBSEventTypes,
} from "obs-websocket-js";

import type {
  DeckButtonAction,
  ObsConnectionSettings,
  ObsConnectionStatus,
  ObsState,
} from "./types";

export type ObsStateListener = (state: ObsState) => void;

export interface ObsClient {
  readonly state: ObsState;
  connect(settings: ObsConnectionSettings): Promise<void>;
  disconnect(): Promise<void>;
  toggleInputMute(inputName: string): Promise<void>;
  setCurrentProgramScene(sceneName: string): Promise<void>;
  toggleSourceVisibility(sceneName: string, sourceName: string): Promise<void>;
  startStream(): Promise<void>;
  stopStream(): Promise<void>;
  toggleRecordPause(): Promise<void>;
  subscribe(listener: ObsStateListener): () => void;
}

const INITIAL_STATE: ObsState = {
  connectionStatus: "idle",
  mutedInputs: {},
  visibleSources: {},
  isStreaming: false,
  isRecordPaused: false,
};

export class ObsWebSocketClient implements ObsClient {
  private readonly obs = new OBSWebSocket();
  private readonly listeners = new Set<ObsStateListener>();
  private internalState: ObsState = INITIAL_STATE;

  constructor() {
    this.obs.on("CurrentProgramSceneChanged", this.handleSceneChanged);
    this.obs.on("InputMuteStateChanged", this.handleMuteChanged);
    this.obs.on("StreamStateChanged", this.handleStreamChanged);
    this.obs.on("RecordStateChanged", this.handleRecordChanged);
    this.obs.on("ConnectionClosed", () => this.updateState({ connectionStatus: "disconnected" }));
    this.obs.on("ConnectionError", (event) =>
      this.updateState({
        connectionStatus: "error",
        lastError: event.message,
      }),
    );
  }

  get state() {
    return this.internalState;
  }

  async connect(settings: ObsConnectionSettings) {
    this.updateState({ connectionStatus: "connecting", lastError: undefined });

    try {
      await this.obs.connect(
        `ws://${settings.host}:${settings.port}`,
        settings.password,
        {
          eventSubscriptions: EventSubscription.All,
        },
      );
      this.updateState({ connectionStatus: "connected", lastError: undefined });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to connect to OBS.";
      this.updateState({ connectionStatus: "error", lastError: message });
      throw error;
    }
  }

  async disconnect() {
    await this.obs.disconnect();
    this.updateState({ connectionStatus: "disconnected" });
  }

  async toggleInputMute(inputName: string) {
    const response = await this.obs.call("ToggleInputMute", { inputName });
    this.updateState({
      mutedInputs: {
        ...this.internalState.mutedInputs,
        [inputName]: response.inputMuted,
      },
    });
  }

  async setCurrentProgramScene(sceneName: string) {
    await this.obs.call("SetCurrentProgramScene", { sceneName });
    this.updateState({ activeSceneName: sceneName });
  }

  async toggleSourceVisibility(sceneName: string, sourceName: string) {
    const { sceneItemId } = await this.obs.call("GetSceneItemId", {
      sceneName,
      sourceName,
    });
    const current = await this.obs.call("GetSceneItemEnabled", {
      sceneName,
      sceneItemId,
    });
    const nextEnabled = !current.sceneItemEnabled;

    await this.obs.call("SetSceneItemEnabled", {
      sceneName,
      sceneItemId,
      sceneItemEnabled: nextEnabled,
    });

    this.updateState({
      visibleSources: {
        ...this.internalState.visibleSources,
        [toSourceKey(sceneName, sourceName)]: nextEnabled,
      },
    });
  }

  async startStream() {
    await this.obs.call("StartStream");
    this.updateState({ isStreaming: true });
  }

  async stopStream() {
    await this.obs.call("StopStream");
    this.updateState({ isStreaming: false });
  }

  async toggleRecordPause() {
    const response = await this.obs.call("ToggleRecordPause");
    this.updateState({ isRecordPaused: response.outputPaused });
  }

  subscribe(listener: ObsStateListener) {
    this.listeners.add(listener);
    listener(this.internalState);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private handleSceneChanged = (
    event: OBSEventTypes["CurrentProgramSceneChanged"],
  ) => {
    this.updateState({ activeSceneName: event.sceneName });
  };

  private handleMuteChanged = (
    event: OBSEventTypes["InputMuteStateChanged"],
  ) => {
    this.updateState({
      mutedInputs: {
        ...this.internalState.mutedInputs,
        [event.inputName]: event.inputMuted,
      },
    });
  };

  private handleStreamChanged = (
    event: OBSEventTypes["StreamStateChanged"],
  ) => {
    this.updateState({ isStreaming: event.outputActive });
  };

  private handleRecordChanged = (
    event: OBSEventTypes["RecordStateChanged"],
  ) => {
    this.updateState({
      isRecordPaused: event.outputState.toLowerCase().includes("pause"),
    });
  };

  private updateState(partial: Partial<ObsState>) {
    this.internalState = {
      ...this.internalState,
      ...partial,
    };

    for (const listener of this.listeners) {
      listener(this.internalState);
    }
  }
}

export function createInitialObsState(
  connectionStatus: ObsConnectionStatus = "idle",
): ObsState {
  return {
    ...INITIAL_STATE,
    connectionStatus,
  };
}

export function toSourceKey(sceneName: string, sourceName: string) {
  return `${sceneName}::${sourceName}`;
}

export async function executeObsAction(client: ObsClient, action: DeckButtonAction) {
  switch (action.type) {
    case "toggleInputMute":
      return client.toggleInputMute(action.inputName);
    case "setCurrentProgramScene":
      return client.setCurrentProgramScene(action.sceneName);
    case "toggleSourceVisibility":
      return client.toggleSourceVisibility(action.sceneName, action.sourceName);
    case "startStream":
      return client.startStream();
    case "stopStream":
      return client.stopStream();
    case "toggleRecordPause":
      return client.toggleRecordPause();
  }
}
