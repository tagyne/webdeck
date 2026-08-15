import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "zustand";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ButtonGroup } from "../components/ui/button-group";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
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
import { Spinner } from "../components/ui/spinner";
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
import {
  createStarterDeckConfig,
  DEFAULT_DECK_GRID,
  getDeckSlotCount,
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
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string>();
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
    setImportError(undefined);
    setIsImporting(true);

    try {
      const text = await file.text();
      const parsed = parseWebdeckImportText(text);
      setIsImportDialogOpen(false);

      const accepted = await ConfirmActionCall.call({
        title: "Replace Current Deck",
        description: "Importing this file will replace the current local deck and any saved OBS connection included in the file.",
        confirmLabel: "Replace Deck",
        cancelLabel: "Cancel",
        confirmVariant: "destructive",
      });

      if (!accepted) {
        setIsImportDialogOpen(true);
        return;
      }

      await deckStore.getState().save(parsed.deck);
      if (parsed.connection) {
        await connectionStore.getState().save(parsed.connection);
      }

      toast.add({
        type: "success",
        title: "Import complete",
        description: "The deck was imported successfully.",
      });
      setIsEditMode(false);
      setEditingSlot(null);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Choose a valid `.webdeck.json` file and try again.",
      );
      setIsImportDialogOpen(true);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <header className="bg-background text-foreground">
        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-row items-center justify-between gap-3">
            <div className="flex w-fit flex-wrap items-center gap-3">
              <ConnectionStatusBadge
                hasSavedConnection={Boolean(connection)}
                status={connectionStatus}
              />
            </div>

            <div className="flex w-fit justify-center px-4">
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
            </div>

            <div aria-label="Deck actions" className="flex w-fit flex-wrap items-center justify-end gap-2" role="group">
              <ButtonGroup aria-label="Import and export deck actions">
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
              </ButtonGroup>
              <Button onClick={() => setIsConnectionDialogOpen(true)}>
                {connection ? "Manage OBS" : "Connect to OBS"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="grid min-h-screen grid-rows-[auto_minmax(0,1fr)] gap-4 bg-background px-4 pb-4 text-foreground sm:px-6 sm:pb-6">
        <Separator />

        <section className="min-h-0">
          <div className="flex h-full min-h-0 flex-col">
            {deck ? (
              <DeckGrid
                className="flex-1"
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
              <div className="grid flex-1 grid-cols-5 content-start gap-3 sm:gap-4">
                {Array.from({ length: getDeckSlotCount(DEFAULT_DECK_GRID) }, (_, slot) => (
                  <Button
                    key={slot}
                    aria-label={`Slot ${slot + 1}: Loading`}
                    variant="ghost"
                    className="aspect-square h-auto w-full rounded-xl border border-dashed text-muted-foreground"
                  >
                    Slot {slot + 1}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
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

      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        if (isImporting) {
          return;
        }

        setIsImportDialogOpen(open);
        if (!open) {
          setImportError(undefined);
        }
      }}
      >
        <DialogContent showCloseButton={!isImporting}>
          <DialogHeader>
            <DialogTitle>Import deck</DialogTitle>
            <DialogDescription>
              Import a saved `.webdeck.json` file and confirm before replacing current local data.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={importError ? true : undefined}>
              <FieldLabel htmlFor="deck-import-file">Import deck file</FieldLabel>
              <FieldContent>
                <Input
                  id="deck-import-file"
                  name="deck-import-file"
                  accept=".json,.webdeck.json,application/json"
                  aria-invalid={importError ? true : undefined}
                  autoComplete="off"
                  disabled={isImporting}
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
            {isImporting ? (
              <div aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <Spinner aria-hidden="true" />
                <span>Importing…</span>
              </div>
            ) : null}
            {importError ? (
              <Alert variant="destructive">
                <AlertTitle>Import failed</AlertTitle>
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            ) : null}
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
    </>
  );
}

export default function Index() {
  const injectedProps = getBrowserTestHarnessProps();

  return <WebdeckApp {...injectedProps} />;
}
