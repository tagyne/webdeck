import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "zustand";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
import { ConnectionDialog } from "../features/obs/connection-dialog";
import { runDeckAction } from "../features/obs/action-runner";
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

function getConnectionStatusVariant({
  status,
  hasSavedConnection,
}: {
  status: ObsClient["state"]["connectionStatus"];
  hasSavedConnection: boolean;
}) {
  if (status === "connected") {
    return "default";
  }

  if (status === "connecting") {
    return "secondary";
  }

  if (status === "disconnected" || status === "error") {
    return "outline";
  }

  return hasSavedConnection ? "secondary" : "outline";
}

function ConnectionStatusBadge({
  status,
  hasSavedConnection,
}: {
  status: ObsClient["state"]["connectionStatus"];
  hasSavedConnection: boolean;
}) {
  const label = status === "connected"
    ? "Connected"
    : status === "connecting"
      ? "Connecting"
      : status === "disconnected" || status === "error"
        ? "Disconnected"
        : hasSavedConnection
          ? "Saved settings"
          : "Setup pending";

  return <Badge variant={getConnectionStatusVariant({ status, hasSavedConnection })}>{label}</Badge>;
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
  const hasAutoOpenedConnectionDialogRef = useRef(false);
  const autoConnectKeyRef = useRef<string>();
  const dangerousConfirmButtonRef = useRef<HTMLButtonElement>(null);
  const [submitError, setSubmitError] = useState<string>();
  const [isSubmittingConnection, setIsSubmittingConnection] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isImportExportMode, setIsImportExportMode] = useState(false);
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
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

  const isConnectionLoading = connectionLoadStatus === "idle" || connectionLoadStatus === "loading";

  useEffect(() => {
    if (isConnectionLoading) {
      return;
    }

    if (connection) {
      hasAutoOpenedConnectionDialogRef.current = false;
      return;
    }

    if (hasAutoOpenedConnectionDialogRef.current) {
      return;
    }

    hasAutoOpenedConnectionDialogRef.current = true;
    setIsConnectionDialogOpen(true);
  }, [connection, isConnectionLoading]);

  const handleConnect = async (settings: ObsConnectionSettings) => {
    setIsSubmittingConnection(true);
    setSubmitError(undefined);

    try {
      if (obsClient.state.connectionStatus === "connected" || obsClient.state.connectionStatus === "connecting") {
        await obsClient.disconnect().catch(() => {
          // Best-effort disconnect before reconnecting with new settings.
        });
      }

      await obsClient.connect(settings);
      await connectionStore.getState().save(settings);

      const { status, error } = connectionStore.getState();
      if (status === "error") {
        setSubmitError(error ?? "Failed to save connection settings.");
        return;
      }

      setIsConnectionDialogOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to connect to OBS.");
    } finally {
      setIsSubmittingConnection(false);
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

  return (
    <main className="min-h-screen bg-[--color-surface] px-4 py-6 text-[--color-ink] sm:px-6 sm:py-10">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-6 rounded-[2rem] border border-[--color-line] bg-[radial-gradient(circle_at_top_left,_rgba(234,88,12,0.18),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(244,239,230,0.96))] p-5 shadow-[0_32px_100px_rgba(15,23,42,0.12)] sm:p-8 lg:flex-row lg:gap-8">
        <div className="flex flex-col gap-6 lg:w-[22rem] lg:shrink-0 xl:w-[24rem]">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[--color-signal]">
              Webdeck OBS PWA
            </p>
            <h1 className="max-w-3xl font-display text-4xl leading-none sm:text-5xl">
              {deck?.name ?? "Main OBS Deck"}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-700">
              Large tap targets, saved connection settings, and local-first deck data stay accessible while the control grid keeps the full remaining canvas.
            </p>
          </div>

          <Card className="rounded-[1.75rem] border border-border/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Connection
                  </p>
                  <CardTitle className="text-2xl">
                    {connection ? `${connection.host}:${connection.port}` : "Configure OBS"}
                  </CardTitle>
                  <CardDescription>{summary}</CardDescription>
                </div>
                <ConnectionStatusBadge
                  hasSavedConnection={Boolean(connection)}
                  status={connectionStatus}
                />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button className="w-full" onClick={() => setIsConnectionDialogOpen(true)}>
                {connection ? "Manage OBS connection" : "Connect to OBS"}
              </Button>
              {connectionStatus !== "connected" && connection ? (
                <Alert>
                  <AlertTitle>OBS connection lost</AlertTitle>
                  <AlertDescription>
                    <p>
                      {lastError ?? "Reconnect OBS to restore trusted button feedback and action execution."}
                    </p>
                  </AlertDescription>
                </Alert>
              ) : null}
              {actionMessage ? (
                <Alert>
                  <AlertDescription>{actionMessage}</AlertDescription>
                </Alert>
              ) : null}
              {pendingDangerousSlot !== null ? (
                <Alert variant="destructive">
                  <AlertTitle>Confirm before running this live action</AlertTitle>
                  <AlertDescription>
                    <p>Stop stream needs an extra confirmation to avoid accidental taps during a show.</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <Button
                        ref={dangerousConfirmButtonRef}
                        variant="destructive"
                        onClick={handleConfirmDangerousAction}
                      >
                        Confirm stop stream
                      </Button>
                      <Button variant="outline" onClick={() => setPendingDangerousSlot(null)}>
                        Cancel
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border border-border/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Deck tools
              </p>
              <CardTitle>Editing and transfer</CardTitle>
              <CardDescription>
                Unused slots stay visible so the editor and import flows can land without reshaping the deck.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div aria-label="Deck tools" className="flex flex-wrap gap-3" role="group">
                <Button
                  aria-pressed={isEditMode}
                  variant={isEditMode ? "default" : "secondary"}
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
                  variant={isImportExportMode ? "default" : "secondary"}
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
            </CardContent>
          </Card>

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

        <aside className="flex min-h-[28rem] flex-1 flex-col rounded-[1.75rem] border border-slate-900/10 bg-slate-950 p-4 text-slate-100 shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:p-5 lg:min-h-0">
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

          <div className="mt-4 flex min-h-0 flex-1 flex-col">
            {deck ? (
              <DeckGrid
                className="flex-1 auto-rows-fr"
                deck={deck}
                activeSlot={activeSlot}
                obsState={obsStateSnapshot}
                onPressSlot={handlePressSlot}
              />
            ) : (
              <div className="grid flex-1 grid-cols-3 grid-rows-3 gap-3 sm:gap-4">
                {Array.from({ length: 9 }, (_, slot) => (
                  <Button
                    key={slot}
                    aria-label={`Slot ${slot + 1}: Loading`}
                    variant="ghost"
                    className="h-full rounded-[1.6rem] border border-dashed border-white/12 bg-white/6 text-slate-300"
                  >
                    Slot {slot + 1}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>

      <ConnectionDialog
        connection={connection}
        connectionStatus={connectionStatus}
        error={submitError}
        isLoading={isConnectionLoading}
        isOpen={isConnectionDialogOpen}
        isSubmitting={isSubmittingConnection}
        lastError={lastError}
        onOpenChange={(open) => {
          setIsConnectionDialogOpen(open);
          if (open) {
            setSubmitError(undefined);
          }
        }}
        onSubmit={handleConnect}
      />
    </main>
  );
}

export default function Index() {
  const injectedProps = getBrowserTestHarnessProps();

  return <WebdeckApp {...injectedProps} />;
}
