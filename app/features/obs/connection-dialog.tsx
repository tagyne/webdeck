import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import type { ObsConnectionSettings, ObsConnectionStatus } from "./types";
import { ConnectionForm } from "./connection-form";

function getConnectionBadgeVariant(status: ObsConnectionStatus) {
  switch (status) {
    case "connected":
      return "default";
    case "connecting":
      return "secondary";
    case "disconnected":
    case "error":
      return "outline";
    default:
      return "secondary";
  }
}

function getConnectionLabel(status: ObsConnectionStatus, hasConnection: boolean) {
  switch (status) {
    case "connected":
      return "Connected";
    case "connecting":
      return "Connecting";
    case "disconnected":
    case "error":
      return "Disconnected";
    default:
      return hasConnection ? "Saved settings" : "Setup pending";
  }
}

export function ConnectionDialog({
  connection,
  connectionStatus,
  isLoading,
  isOpen,
  isSubmitting,
  error,
  lastError,
  onOpenChange,
  onSubmit,
}: {
  connection?: ObsConnectionSettings;
  connectionStatus: ObsConnectionStatus;
  isLoading: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  error?: string;
  lastError?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ObsConnectionSettings) => Promise<void>;
}) {
  const hasConnection = Boolean(connection);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6 sm:p-7">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-10">
            <DialogTitle>OBS connection</DialogTitle>
            <Badge variant={getConnectionBadgeVariant(connectionStatus)}>
              {getConnectionLabel(connectionStatus, hasConnection)}
            </Badge>
          </div>
          <DialogDescription>
            Configure the local OBS WebSocket endpoint in a dedicated modal so the deck can stay focused on live controls.
          </DialogDescription>
        </DialogHeader>

        {connectionStatus !== "connected" && hasConnection ? (
          <Alert>
            <AlertTitle>OBS connection unavailable</AlertTitle>
            <AlertDescription>
              <p>
                {lastError ?? "Reconnect OBS to restore action execution and trusted live feedback."}
              </p>
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="px-1 py-2 text-sm text-muted-foreground">Loading saved connection settings...</div>
        ) : (
          <ConnectionForm
            defaultValues={connection}
            error={error}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
        )}

        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
