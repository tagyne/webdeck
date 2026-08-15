import { useEffect, useRef } from "react";
import { createCallable } from "react-call";

import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

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
      <DialogContent showCloseButton={false} className="max-w-2xl bg-muted/30">
        <DialogHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Preview
          </p>
          <DialogTitle className="text-2xl font-semibold">{deckName}</DialogTitle>
          <DialogDescription>{gridLabel}</DialogDescription>
          <DialogDescription>{buttonCountLabel}</DialogDescription>
          <DialogDescription>
            {hasConnection ? "Connection settings included" : "No connection settings included"}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-start">
          <Button
            ref={confirmButtonRef}
            className="sm:min-w-40"
            onClick={() => {
              call.end(true);
            }}
          >
            Replace current deck
          </Button>
          <Button
            className="sm:min-w-32"
            variant="secondary"
            onClick={() => {
              call.end(false);
            }}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const ImportPreviewCall = createCallable<ImportPreview, boolean>(ImportPreviewDialog);
