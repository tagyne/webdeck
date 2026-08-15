import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "zustand";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "../components/ui/field";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
import { toast } from "../components/ui/toast";
import { getBrowserTestHarnessProps } from "../testing/browser-test-harness";
import { ButtonEditor } from "../features/deck/button-editor";
import { ConfirmActionCall } from "../features/confirm/confirm-action-call";
import {
  createWebdeckExportFilename,
  parseWebdeckImportText,
  serializeWebdeckExport,
} from "../features/deck/import-export";
import { ImportPreviewCall } from "../features/deck/import-preview-call";
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
  const lastBlockedActionToastAtRef = useRef(0);
  const [submitError, setSubmitError] = useState<string>();
  const [isSubmittingConnection, setIsSubmittingConnection] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

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
  const previousConnectionStatusRef = useRef(connectionStatus);

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
    const previousStatus = previousConnectionStatusRef.current;

    if (!connection) {
      previousConnectionStatusRef.current = connectionStatus;
      return;
    }

    if (
      (previousStatus === "connected" || previousStatus === "connecting")
      && (connectionStatus === "disconnected" || connectionStatus === "error")
    ) {
      toast.add({
        type: "error",
        title: "OBS connection lost",
        description: lastError ?? "Reconnect OBS to restore trusted button feedback and action execution.",
      });
    }

    if (
      (previousStatus === "disconnected" || previousStatus === "error")
      && connectionStatus === "connected"
    ) {
      toast.add({
        type: "success",
        title: "OBS reconnected",
        description: "Deck actions are available again.",
      });
    }

    previousConnectionStatusRef.current = connectionStatus;
  }, [connection, connectionStatus, lastError]);

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
    const button = deck?.buttons.find((item) => item.slot === slot);

    if (isEditMode) {
      setEditingSlot(slot);
      return;
    }

    if (!button) {
      setEditingSlot(slot);
      return;
    }

    if (connectionStatus !== "connected") {
      const now = Date.now();

      if (now - lastBlockedActionToastAtRef.current > 1_500) {
        toast.add({
          type: "info",
          description: "Actions are paused until OBS reconnects.",
        });
        lastBlockedActionToastAtRef.current = now;
      }

      return;
    }

    if (isDangerousDeckAction(button.action)) {
      const accepted = await ConfirmActionCall.call({
        title: "Confirm Stop Stream",
        description: "Stop stream needs an extra confirmation to avoid accidental taps during a show.",
        confirmLabel: "Confirm Stop Stream",
        cancelLabel: "Cancel",
        confirmVariant: "destructive",
      });

      if (!accepted) {
        return;
      }
    }

    setActiveSlot(slot);

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

  const handleDeleteButton = async (nextDeck: ReturnType<typeof createStarterDeckConfig>) => {
    await deckStore.getState().save(nextDeck);
    setEditingSlot(null);
  };

  const handleQuickDeleteButton = async (slot: number) => {
    if (!deck) {
      return;
    }

    const button = deck.buttons.find((item) => item.slot === slot);
    if (!button) {
      return;
    }

    const buttonName = button.label.trim() || `slot ${slot + 1}`;
    const accepted = await ConfirmActionCall.call({
      title: "Delete Deck Button",
      description: `Delete ${buttonName} from the deck? This only removes the local shortcut.`,
      confirmLabel: "Delete Button",
      cancelLabel: "Keep Button",
      confirmVariant: "destructive",
    });

    if (!accepted) {
      return;
    }

    await deckStore.getState().save({
      ...deck,
      buttons: deck.buttons.filter((item) => item.slot !== slot),
      updatedAt: new Date().toISOString(),
    });

    if (editingSlot === slot) {
      setEditingSlot(null);
    }
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
    try {
      const text = await file.text();
      const parsed = parseWebdeckImportText(text);
      setIsImportDialogOpen(false);

      const accepted = await ImportPreviewCall.call({
        deckName: parsed.deck.name,
        gridLabel: `${parsed.deck.grid.columns} x ${parsed.deck.grid.rows}`,
        buttonCountLabel: `${parsed.deck.buttons.length} configured button${parsed.deck.buttons.length === 1 ? "" : "s"}`,
        hasConnection: Boolean(parsed.connection),
      });

      if (!accepted) {
        setIsImportDialogOpen(true);
        return;
      }

      await deckStore.getState().save(parsed.deck);
      if (parsed.connection) {
        await connectionStore.getState().save(parsed.connection);
      }

      setIsEditMode(false);
      setEditingSlot(null);
    } catch (error) {
      toast.add({
        type: "error",
        title: "Import failed",
        description: error instanceof Error ? error.message : "Choose a valid `.webdeck.json` file and try again.",
      });
    }
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
          </div>

          <div aria-label="Deck actions" className="flex flex-wrap items-center justify-end gap-2" role="group">
            <Button
              aria-pressed={isEditMode}
              variant={isEditMode ? "default" : "outline"}
              onClick={() => {
                setIsEditMode((value) => !value);
                setEditingSlot(null);
              }}
            >
              {isEditMode ? "Exit edit" : "Edit deck"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
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

        <Separator />
      </header>

      <section className="flex min-h-0 flex-1 p-4 sm:p-6">
        <div className="flex min-h-0 flex-1 flex-col">
          {deck ? (
            <DeckGrid
              className="flex-1 auto-rows-fr"
              deck={deck}
              activeSlot={activeSlot}
              isEditMode={isEditMode}
              onDeleteSlot={(slot) => {
                void handleQuickDeleteButton(slot);
              }}
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
        <DialogContent className="max-w-4xl sm:max-w-3xl">
          {deck && editingSlot !== null ? (
            <ButtonEditor
              button={deck.buttons.find((item) => item.slot === editingSlot)}
              deck={deck}
              slot={editingSlot}
              onCancel={() => setEditingSlot(null)}
              onDelete={handleDeleteButton}
              onSave={handleSaveButton}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import deck</DialogTitle>
            <DialogDescription>
              Import a saved `.webdeck.json` file and preview it before replacing current local data.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="deck-import-file">Import deck file</FieldLabel>
              <FieldContent>
                <Input
                  id="deck-import-file"
                  name="deck-import-file"
                  accept=".json,.webdeck.json,application/json"
                  type="file"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (!file) {
                      return;
                    }

                    void handleImportFile(file);
                    event.currentTarget.value = "";
                  }}
                />
              </FieldContent>
            </Field>
          </FieldGroup>
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
      <ConfirmActionCall />
      <ImportPreviewCall />
    </main>
  );
}

export default function Index() {
  const injectedProps = getBrowserTestHarnessProps();

  return <WebdeckApp {...injectedProps} />;
}
