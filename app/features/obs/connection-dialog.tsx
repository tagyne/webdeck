import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
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
      <DialogContent className="max-w-4xl sm:max-w-3xl">
        <ConnectionForm
          connectionStatus={connectionStatus}
          defaultValues={connection}
          error={error}
          formId="obs-connection-form"
          hasConnection={hasConnection}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          statusBadge={(
            <Badge variant={getConnectionBadgeVariant(connectionStatus)}>
              {getConnectionLabel(connectionStatus, hasConnection)}
            </Badge>
          )}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
          unavailableAlert={
            connectionStatus !== "connected" && hasConnection ? (
              <Alert>
                <AlertTitle>OBS connection unavailable</AlertTitle>
                <AlertDescription>
                  <p>
                    {lastError ?? "Reconnect OBS to restore action execution and trusted live feedback."}
                  </p>
                </AlertDescription>
              </Alert>
            ) : null
          }
        />
      </DialogContent>
    </Dialog>
  );
}
