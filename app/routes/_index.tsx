import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "zustand";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Separator } from "../components/ui/separator";
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
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
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
    setIsEditMode(false);
    setEditingSlot(null);
    setPendingDangerousSlot(null);
    setIsImportDialogOpen(false);
  };

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <ConnectionStatusBadge
              hasSavedConnection={Boolean(connection)}
              status={connectionStatus}
            />
            <p className="truncate text-sm text-muted-foreground">
              {connection ? `${connection.host}:${connection.port}` : "No OBS endpoint saved"} · {summary}
            </p>
          </div>

          <div aria-label="Deck actions" className="flex flex-wrap items-center justify-end gap-2" role="group">
            <Button
              aria-pressed={isEditMode}
              variant={isEditMode ? "default" : "outline"}
              onClick={() => {
                setIsEditMode((value) => !value);
                setEditingSlot(null);
                setPendingDangerousSlot(null);
              }}
            >
              {isEditMode ? "Exit edit" : "Edit deck"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setImportError(undefined);
                setImportPreview(undefined);
                setIsImportDialogOpen(true);
              }}
            >
              Import
            </Button>
            <Button variant="outline" onClick={handleExport}>
              Export
            </Button>
            <Button onClick={() => setIsConnectionDialogOpen(true)}>
              {connection ? "Manage OBS" : "Connect to OBS"}
            </Button>
          </div>
        </div>

        {(connectionStatus !== "connected" && connection) || actionMessage || pendingDangerousSlot !== null ? (
          <div className="flex flex-col gap-3">
            {connectionStatus !== "connected" && connection ? (
              <Alert>
                <AlertTitle>OBS connection lost</AlertTitle>
                <AlertDescription>
                  {lastError ?? "Reconnect OBS to restore trusted button feedback and action execution."}
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
          </div>
        ) : null}

        <Separator />
      </header>

      <section className="flex min-h-0 flex-1 p-4 sm:p-6">
        <div className="flex min-h-0 flex-1 flex-col">
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
                  className="h-full rounded-xl border border-dashed text-muted-foreground"
                >
                  Slot {slot + 1}
                </Button>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={editingSlot !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingSlot(null);
        }
      }}
      >
        <DialogContent className="max-w-4xl p-0 sm:max-w-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit deck slot</DialogTitle>
            <DialogDescription>Update the selected slot without leaving the deck grid.</DialogDescription>
          </DialogHeader>
          {connection && deck && editingSlot !== null ? (
            <ButtonEditor
              button={deck.buttons.find((item) => item.slot === editingSlot)}
              deck={deck}
              slot={editingSlot}
              onCancel={() => setEditingSlot(null)}
              onSave={handleSaveButton}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-3xl p-0 sm:max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Import deck</DialogTitle>
            <DialogDescription>Import a saved deck file and preview it before replacing current local data.</DialogDescription>
          </DialogHeader>
          <ImportExportPanel
            error={importError}
            showExport={false}
            onCancelPreview={() => {
              setImportPreview(undefined);
              setImportError(undefined);
              setIsImportDialogOpen(false);
            }}
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
        </DialogContent>
      </Dialog>

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
