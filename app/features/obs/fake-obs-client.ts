import {
  createInitialObsState,
  toSourceKey,
  type ObsClient,
  type ObsStateListener,
} from "./obs-client";
import type {
  DeckButtonAction,
  ObsConnectionSettings,
  ObsState,
} from "./types";

export class FakeObsClient implements ObsClient {
  readonly calls: DeckButtonAction[] = [];
  readonly listeners = new Set<ObsStateListener>();
  state: ObsState = createInitialObsState();
  private readonly connectErrorMessage?: string;

  constructor(options?: { connectErrorMessage?: string }) {
    this.connectErrorMessage = options?.connectErrorMessage;
  }

  async connect(settings: ObsConnectionSettings) {
    void settings;
    if (this.connectErrorMessage) {
      this.state = {
        ...this.state,
        connectionStatus: "error",
        lastError: this.connectErrorMessage,
      };
      this.emit();
      throw new Error(this.connectErrorMessage);
    }

    this.state = {
      ...this.state,
      connectionStatus: "connected",
    };
    this.emit();
  }

  async disconnect() {
    this.state = {
      ...this.state,
      connectionStatus: "disconnected",
    };
    this.emit();
  }

  async toggleInputMute(inputName: string) {
    this.calls.push({ type: "toggleInputMute", inputName });
    this.state = {
      ...this.state,
      mutedInputs: {
        ...this.state.mutedInputs,
        [inputName]: !this.state.mutedInputs[inputName],
      },
    };
    this.emit();
  }

  async setCurrentProgramScene(sceneName: string) {
    this.calls.push({ type: "setCurrentProgramScene", sceneName });
    this.state = {
      ...this.state,
      activeSceneName: sceneName,
    };
    this.emit();
  }

  async toggleSourceVisibility(sceneName: string, sourceName: string) {
    this.calls.push({ type: "toggleSourceVisibility", sceneName, sourceName });
    const key = toSourceKey(sceneName, sourceName);
    const nextVisible = !(this.state.visibleSources[key] ?? true);
    this.state = {
      ...this.state,
      visibleSources: {
        ...this.state.visibleSources,
        [key]: nextVisible,
      },
    };
    this.emit();
  }

  async startStream() {
    this.calls.push({ type: "startStream" });
    this.state = {
      ...this.state,
      isStreaming: true,
    };
    this.emit();
  }

  async stopStream() {
    this.calls.push({ type: "stopStream" });
    this.state = {
      ...this.state,
      isStreaming: false,
    };
    this.emit();
  }

  async toggleRecordPause() {
    this.calls.push({ type: "toggleRecordPause" });
    this.state = {
      ...this.state,
      isRecordPaused: !this.state.isRecordPaused,
    };
    this.emit();
  }

  subscribe(listener: ObsStateListener) {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  pushState(partial: Partial<ObsState>) {
    this.state = {
      ...this.state,
      ...partial,
    };
    this.emit();
  }

  private emit() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
