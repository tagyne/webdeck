import { useEffect, useRef } from "react";
import { createCallable } from "react-call";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent } from "../../components/ui/dialog";

export type ImportPreview = {
  deckName: string;
  gridLabel: string;
  buttonCountLabel: string;
  hasConnection: boolean;
};

function ImportPreviewDialog({
  buttonCountLabel,
  call,
  deckName,
  gridLabel,
  hasConnection,
}: ImportPreview & {
  call: {
    end: (value: boolean) => void;
  };
}) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmButtonRef.current?.focus();
  }, []);

  return (
    <Dialog open onOpenChange={(open) => {
      if (!open) {
        call.end(false);
      }
    }}
    >
      <DialogContent showCloseButton={false} className="max-w-2xl p-0">
        <Card
          aria-label="Import preview"
          className="border-0 bg-muted/30 shadow-none"
          role="dialog"
          size="sm"
        >
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Preview
            </p>
            <CardTitle className="text-2xl font-semibold">{deckName}</CardTitle>
            <CardDescription>{gridLabel}</CardDescription>
            <CardDescription>{buttonCountLabel}</CardDescription>
            <CardDescription>
              {hasConnection ? "Connection settings included" : "No connection settings included"}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex gap-3">
            <Button
              ref={confirmButtonRef}
              className="flex-1"
              onClick={() => {
                call.end(true);
              }}
            >
              Replace current deck
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              onClick={() => {
                call.end(false);
              }}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export const ImportPreviewCall = createCallable<ImportPreview, boolean>(ImportPreviewDialog);
