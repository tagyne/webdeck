import { createCallable } from "react-call";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

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
  return (
    <AlertDialog open onOpenChange={(open) => {
      if (!open) {
        call.end(false);
      }
    }}
    >
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            variant={confirmVariant}
            onClick={() => {
              call.end(true);
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
          <AlertDialogCancel
            variant="outline"
            onClick={() => {
              call.end(false);
            }}
          >
            {cancelLabel}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const ConfirmActionCall = createCallable<ConfirmActionCallProps, boolean>(ConfirmActionDialog);
