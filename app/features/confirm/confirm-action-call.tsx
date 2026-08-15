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

type ConfirmActionCallProps = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
};

function ConfirmActionDialog({
  call,
  cancelLabel = "Cancel",
  confirmLabel,
  confirmVariant = "default",
  description,
  title,
}: ConfirmActionCallProps & {
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
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            ref={confirmButtonRef}
            type="button"
            variant={confirmVariant}
            onClick={() => {
              call.end(true);
            }}
          >
            {confirmLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              call.end(false);
            }}
          >
            {cancelLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const ConfirmActionCall = createCallable<ConfirmActionCallProps, boolean>(ConfirmActionDialog);
