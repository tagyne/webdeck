import { createStore } from "zustand/vanilla";

import type { ObsConnectionStatus } from "../features/obs/types";

type ObsStoreState = {
  connectionStatus: ObsConnectionStatus;
  activeSceneName?: string;
  mutedInputs: Record<string, boolean>;
  visibleSources: Record<string, boolean>;
  isStreaming: boolean;
  isRecordPaused: boolean;
  lastError?: string;
  setConnectionStatus: (status: ObsConnectionStatus) => void;
  setStreaming: (value: boolean) => void;
  setRecordPaused: (value: boolean) => void;
  setMuted: (inputName: string, value: boolean) => void;
  setSourceVisible: (sourceKey: string, value: boolean) => void;
  setActiveScene: (sceneName?: string) => void;
  setLastError: (value?: string) => void;
  sync: (state: {
    connectionStatus: ObsConnectionStatus;
    activeSceneName?: string;
    mutedInputs: Record<string, boolean>;
    visibleSources: Record<string, boolean>;
    isStreaming: boolean;
    isRecordPaused: boolean;
    lastError?: string;
  }) => void;
};

export function createObsStore() {
  return createStore<ObsStoreState>()((set) => ({
    connectionStatus: "idle",
    activeSceneName: undefined,
    mutedInputs: {},
    visibleSources: {},
    isStreaming: false,
    isRecordPaused: false,
    lastError: undefined,
    setConnectionStatus(connectionStatus) {
      set({ connectionStatus });
    },
    setStreaming(isStreaming) {
      set({ isStreaming });
    },
    setRecordPaused(isRecordPaused) {
      set({ isRecordPaused });
    },
    setMuted(inputName, value) {
      set((state) => ({
        mutedInputs: {
          ...state.mutedInputs,
          [inputName]: value,
        },
      }));
    },
    setSourceVisible(sourceKey, value) {
      set((state) => ({
        visibleSources: {
          ...state.visibleSources,
          [sourceKey]: value,
        },
      }));
    },
    setActiveScene(activeSceneName) {
      set({ activeSceneName });
    },
    setLastError(lastError) {
      set({ lastError });
    },
    sync(state) {
      set(state);
    },
  }));
}

export const obsStore = createObsStore();
