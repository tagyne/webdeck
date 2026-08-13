import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "zustand";

import { Button } from "../components/ui/button";
import { getBrowserTestHarnessProps } from "../testing/browser-test-harness";
import { ButtonEditor } from "../features/deck/button-editor";
import {
  createWebdeckExportFilename,
  parseWebdeckImportText,
  serializeWebdeckExport,
} from "../features/deck/import-export";
import { ImportExportPanel } from "../features/deck/import-export-panel";
import {
  createStarterDeckConfig,
  isDangerousDeckAction,
} from "../features/deck/types";
import { DeckGrid } from "../features/deck/deck-grid";
import { runDeckAction } from "../features/obs/action-runner";
import { ConnectionForm } from "../features/obs/connection-form";
import { ObsWebSocketClient } from "../features/obs/obs-client";
import type { ObsClient } from "../features/obs/obs-client";
import type { ObsConnectionSettings } from "../features/obs/types";
import { connectionStore as defaultConnectionStore } from "../stores/connection-store";
import { deckStore as defaultDeckStore } from "../stores/deck-store";
import { obsStore as defaultObsStore } from "../stores/obs-store";
import type { createConnectionStore } from "../stores/connection-store";
import type { createDeckStore } from "../stores/deck-store";
import type { createObsStore } from "../stores/obs-store";

const defaultObsClient = new ObsWebSocketClient();

type ConnectionStoreApi = ReturnType<typeof createConnectionStore>;
type DeckStoreApi = ReturnType<typeof createDeckStore>;
type ObsStoreApi = ReturnType<typeof createObsStore>;

export function meta() {
  return [
    { title: "Webdeck" },
    {
      name: "description",
      content: "Installable local-first OBS control deck for phones and tablets.",
    },
  ];
}

function ConnectionStatusBadge({
  status,
  hasSavedConnection,
}: {
  status: ObsClient["state"]["connectionStatus"];
  hasSavedConnection: boolean;
}) {
  if (status === "connected") {
    return (
      <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-emerald-200">
        Connected
      </span>
    );
  }

  if (status === "connecting") {
    return (
      <span className="rounded-full bg-sky-400/20 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-sky-200">
        Connecting
      </span>
    );
  }

  if (status === "disconnected" || status === "error") {
    return (
      <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-amber-200">
        Disconnected
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-amber-200">
      {hasSavedConnection ? "Saved settings" : "Setup pending"}
    </span>
  );
}

export function WebdeckApp({
  connectionStore = defaultConnectionStore,
  deckStore = defaultDeckStore,
  obsStore = defaultObsStore,
  obsClient = defaultObsClient,
}: {
  connectionStore?: ConnectionStoreApi;
  deckStore?: DeckStoreApi;
  obsStore?: ObsStoreApi;
  obsClient?: ObsClient;
}) {
  const hasBootstrapped = useRef(false);
  const autoConnectKeyRef = useRef<string>();
  const dangerousConfirmButtonRef = useRef<HTMLButtonElement>(null);
  const [submitError, setSubmitError] = useState<string>();
  const [isSubmittingConnection, setIsSubmittingConnection] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isImportExportMode, setIsImportExportMode] = useState(false);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [pendingDangerousSlot, setPendingDangerousSlot] = useState<number | null>(null);
  const [importError, setImportError] = useState<string>();
  const [importPreview, setImportPreview] = useState<ReturnType<typeof parseWebdeckImportText>>();

  const connection = useStore(connectionStore, (state) => state.connection);
  const connectionStatus = useStore(obsStore, (state) => state.connectionStatus);
  const deck = useStore(deckStore, (state) => state.deck);
  const deckStatus = useStore(deckStore, (state) => state.status);
  const connectionLoadStatus = useStore(connectionStore, (state) => state.status);
  const isStreaming = useStore(obsStore, (state) => state.isStreaming);
  const isRecordPaused = useStore(obsStore, (state) => state.isRecordPaused);
  const activeSceneName = useStore(obsStore, (state) => state.activeSceneName);
  const mutedInputs = useStore(obsStore, (state) => state.mutedInputs);
  const visibleSources = useStore(obsStore, (state) => state.visibleSources);
  const lastError = useStore(obsStore, (state) => state.lastError);
  const [actionMessage, setActionMessage] = useState<string>();

  const summary = useMemo(() => {
    return [
      isStreaming ? "stream live" : "stream idle",
      isRecordPaused ? "record paused" : "record ready",
    ].join(" / ");
  }, [isRecordPaused, isStreaming]);

  const obsStateSnapshot = useMemo(() => ({
    connectionStatus,
    activeSceneName,
    mutedInputs,
    visibleSources,
    isStreaming,
    isRecordPaused,
    lastError,
  }), [
    activeSceneName,
    connectionStatus,
    isRecordPaused,
    isStreaming,
    lastError,
    mutedInputs,
    visibleSources,
  ]);

  useEffect(() => {
    if (hasBootstrapped.current) {
      return;
    }

    hasBootstrapped.current = true;
    void connectionStore.getState().load();
    void deckStore.getState().load();

    const unsubscribe = obsClient.subscribe((state) => {
      obsStore.getState().sync(state);
    });

    return unsubscribe;
  }, [connectionStore, deckStore, obsClient, obsStore]);

  useEffect(() => {
    if (deckStatus === "ready" && !deck) {
      void deckStore.getState().save(createStarterDeckConfig());
    }
  }, [deck, deckStatus, deckStore]);

  useEffect(() => {
    if (!connection) {
      autoConnectKeyRef.current = undefined;
      return;
    }

    if (connectionStatus !== "idle" && connectionStatus !== "disconnected") {
      return;
    }

    const key = JSON.stringify(connection);
    if (autoConnectKeyRef.current === key) {
      return;
    }

    autoConnectKeyRef.current = key;
    void obsClient.connect(connection).catch(() => {
      // The client and store already surface the connection error state.
    });
  }, [connection, connectionStatus, obsClient]);

  useEffect(() => {
    if (pendingDangerousSlot !== null) {
      dangerousConfirmButtonRef.current?.focus();
    }
  }, [pendingDangerousSlot]);

  const handleConnect = async (settings: ObsConnectionSettings) => {
    setIsSubmittingConnection(true);
    setSubmitError(undefined);

    try {
      await obsClient.connect(settings);
      await connectionStore.getState().save(settings);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to connect to OBS.");
    } finally {
      setIsSubmittingConnection(false);
    }
  };

  const handleReconnect = async () => {
    if (!connection) {
      return;
    }

    setActionMessage(undefined);

    try {
      await obsClient.connect(connection);
    } catch {
      // The client and store already surface the reconnect error state.
    }
  };

  const handlePressSlot = async (slot: number) => {
    if (isEditMode) {
      setPendingDangerousSlot(null);
      setEditingSlot(slot);
      return;
    }

    if (connectionStatus !== "connected") {
      setActionMessage("Actions are paused until OBS reconnects.");
      return;
    }

    const button = deck?.buttons.find((item) => item.slot === slot);
    if (!button) {
      return;
    }

    if (isDangerousDeckAction(button.action)) {
      setPendingDangerousSlot(slot);
      setActionMessage(undefined);
      return;
    }

    setPendingDangerousSlot(null);
    setActiveSlot(slot);
    setActionMessage(undefined);

    try {
      await runDeckAction(obsClient, button.action);
    } finally {
      setActiveSlot(null);
    }
  };

  const handleConfirmDangerousAction = async () => {
    if (pendingDangerousSlot === null) {
      return;
    }

    const button = deck?.buttons.find((item) => item.slot === pendingDangerousSlot);
    if (!button) {
      setPendingDangerousSlot(null);
      return;
    }

    setActiveSlot(pendingDangerousSlot);
    setPendingDangerousSlot(null);
    setActionMessage(undefined);

    try {
      await runDeckAction(obsClient, button.action);
    } finally {
      setActiveSlot(null);
    }
  };

  const handleSaveButton = async (nextDeck: ReturnType<typeof createStarterDeckConfig>) => {
    await deckStore.getState().save(nextDeck);
    setEditingSlot(null);
  };

  const handleExport = () => {
    if (!deck) {
      return;
    }

    const json = serializeWebdeckExport({
      deck,
      connection,
    });
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = createWebdeckExportFilename(deck.name);
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    setImportError(undefined);
    setImportPreview(undefined);

    try {
      const text = await file.text();
      const parsed = parseWebdeckImportText(text);
      setImportPreview(parsed);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unable to import this file.");
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview) {
      return;
    }

    await deckStore.getState().save(importPreview.deck);
    if (importPreview.connection) {
      await connectionStore.getState().save(importPreview.connection);
    }
    setImportPreview(undefined);
    setImportError(undefined);
    setIsImportExportMode(false);
    setIsEditMode(false);
    setEditingSlot(null);
    setPendingDangerousSlot(null);
  };

  const isLoading = connectionLoadStatus === "idle" || connectionLoadStatus === "loading" || deckStatus === "idle" || deckStatus === "loading";

  return (
    <main className="min-h-screen bg-[--color-surface] px-4 py-6 text-[--color-ink] sm:px-6 sm:py-10">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-6 rounded-[2rem] border border-[--color-line] bg-[radial-gradient(circle_at_top_left,_rgba(234,88,12,0.18),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(244,239,230,0.96))] p-5 shadow-[0_32px_100px_rgba(15,23,42,0.12)] sm:p-8 lg:grid lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[--color-signal]">
              Webdeck OBS PWA
            </p>
            <h1 className="max-w-3xl font-display text-4xl leading-none sm:text-5xl">
              {connection ? deck?.name ?? "Main OBS Deck" : "Connect to OBS"}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-700">
              {connection
                ? "Large tap targets, saved connection settings, and local-first deck data are ready for the next editing and live-state slices."
                : "Add your OBS WebSocket host, port, and password. The app keeps the form editable, saves settings locally, and only moves forward after a successful connection."}
            </p>
          </div>

          {connection ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-[1.5rem] border border-[--color-line] bg-white/90 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Connection
                </p>
                <p className="mt-3 text-xl font-semibold">{connection.host}:{connection.port}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {summary}
                </p>
                {connectionStatus !== "connected" ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="font-semibold">OBS connection lost</p>
                    <p className="mt-1">
                      {lastError ?? "Reconnect OBS to restore trusted button feedback and action execution."}
                    </p>
                    <div className="mt-3">
                      <Button
                        variant="secondary"
                        disabled={connectionStatus === "connecting"}
                        onClick={() => void handleReconnect()}
                      >
                        {connectionStatus === "connecting" ? "Reconnecting..." : "Reconnect OBS"}
                      </Button>
                    </div>
                  </div>
                ) : null}
                {actionMessage ? (
                  <div className="mt-4 rounded-2xl border border-[--color-line] bg-[--color-surface] px-4 py-3 text-sm text-slate-700">
                    {actionMessage}
                  </div>
                ) : null}
                {pendingDangerousSlot !== null ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-950">
                    <p className="font-semibold">Confirm before running this live action</p>
                    <p className="mt-1">
                      Stop stream needs an extra confirmation to avoid accidental taps during a show.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <Button
                        ref={dangerousConfirmButtonRef}
                        variant="primary"
                        onClick={handleConfirmDangerousAction}
                      >
                        Confirm stop stream
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setPendingDangerousSlot(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </article>

              <article className="rounded-[1.5rem] border border-[--color-line] bg-white/90 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Next up
                </p>
                <p className="mt-3 text-xl font-semibold">Editing and import/export</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Unused slots stay visible so the editor and import flows can land without reshaping the deck.
                </p>
                <div
                  aria-label="Deck tools"
                  className="mt-4 flex flex-wrap gap-3"
                  role="group"
                >
                  <Button
                    aria-pressed={isEditMode}
                    variant={isEditMode ? "primary" : "secondary"}
                    onClick={() => {
                      setIsEditMode((value) => !value);
                      setIsImportExportMode(false);
                      setImportPreview(undefined);
                      setImportError(undefined);
                      setEditingSlot(null);
                      setPendingDangerousSlot(null);
                    }}
                  >
                    {isEditMode ? "Exit edit deck" : "Edit deck"}
                  </Button>
                  <Button
                    variant={isImportExportMode ? "primary" : "secondary"}
                    onClick={() => {
                      setIsImportExportMode((value) => !value);
                      setIsEditMode(false);
                      setEditingSlot(null);
                      setImportPreview(undefined);
                      setImportError(undefined);
                      setPendingDangerousSlot(null);
                    }}
                  >
                    {isImportExportMode ? "Close transfer" : "Import / export"}
                  </Button>
                </div>
              </article>
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-[--color-line] bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              {isLoading ? (
                <p className="text-sm text-slate-600">Loading saved connection settings...</p>
              ) : (
                <ConnectionForm
                  defaultValues={connection}
                  error={submitError}
                  isSubmitting={isSubmittingConnection}
                  onSubmit={handleConnect}
                />
              )}
            </div>
          )}

          {connection && deck && editingSlot !== null ? (
            <ButtonEditor
              button={deck.buttons.find((item) => item.slot === editingSlot)}
              deck={deck}
              slot={editingSlot}
              onCancel={() => setEditingSlot(null)}
              onSave={handleSaveButton}
            />
          ) : null}

          {connection && deck && isImportExportMode ? (
            <ImportExportPanel
              error={importError}
              onCancelPreview={() => setImportPreview(undefined)}
              onConfirmPreview={handleConfirmImport}
              onExport={handleExport}
              onImportFile={handleImportFile}
              preview={importPreview
                ? {
                    deckName: importPreview.deck.name,
                    gridLabel: `${importPreview.deck.grid.columns} x ${importPreview.deck.grid.rows}`,
                    buttonCountLabel: `${importPreview.deck.buttons.length} configured button${importPreview.deck.buttons.length === 1 ? "" : "s"}`,
                    hasConnection: Boolean(importPreview.connection),
                  }
                : undefined}
            />
          ) : null}
        </div>

        <aside className="grid gap-4 rounded-[1.75rem] border border-slate-900/10 bg-slate-950 p-4 text-slate-100 shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:p-5">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <span className="text-sm text-slate-300">Connection</span>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                {connection ? "local settings saved" : "setup required"}
              </p>
            </div>
            <ConnectionStatusBadge
              hasSavedConnection={Boolean(connection)}
              status={connectionStatus}
            />
          </div>

          {deck ? (
            <DeckGrid
              deck={deck}
              activeSlot={activeSlot}
              obsState={obsStateSnapshot}
              onPressSlot={handlePressSlot}
            />
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 9 }, (_, slot) => (
                <Button
                  key={slot}
                  aria-label={`Slot ${slot + 1}: Loading`}
                  variant="ghost"
                  className="aspect-square rounded-[1.6rem] border border-dashed border-white/12 bg-white/6 text-slate-300"
                >
                  Slot {slot + 1}
                </Button>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

export default function Index() {
  const injectedProps = getBrowserTestHarnessProps();

  return <WebdeckApp {...injectedProps} />;
}
