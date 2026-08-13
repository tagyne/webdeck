import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
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
      <DialogContent className="max-w-2xl rounded-[1.75rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,_rgba(234,88,12,0.12),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.99),_rgba(244,239,230,0.98))] p-6 sm:p-7">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-10">
            <div className="flex flex-col gap-2">
              <DialogTitle>OBS connection</DialogTitle>
              <DialogDescription>
                Configure the local OBS WebSocket endpoint in a dedicated modal so the deck can stay focused on live controls.
              </DialogDescription>
            </div>
            <Badge variant={getConnectionBadgeVariant(connectionStatus)}>
              {getConnectionLabel(connectionStatus, hasConnection)}
            </Badge>
          </div>
        </DialogHeader>

        <Card className="border border-border/70 bg-background/80 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Current endpoint</CardTitle>
            <CardDescription>
              {connection
                ? `${connection.host}:${connection.port}`
                : "No OBS endpoint saved on this device yet."}
            </CardDescription>
          </CardHeader>
          {connectionStatus !== "connected" && hasConnection ? (
            <CardContent>
              <Alert>
                <AlertTitle>OBS connection unavailable</AlertTitle>
                <AlertDescription>
                  <p>
                    {lastError ?? "Reconnect OBS to restore action execution and trusted live feedback."}
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          ) : null}
        </Card>

        {isLoading ? (
          <div className="px-1 py-2 text-sm text-slate-600">Loading saved connection settings...</div>
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
