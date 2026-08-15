import { CheckIcon } from "lucide-react";

import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { cn } from "../../lib/utils";
import {
  DECK_BUTTON_COLORS,
  getDeckButtonColor,
  type DeckButtonColor,
} from "./button-colors";

export function ButtonColorDialog({
  onOpenChange,
  onSelect,
  open,
  value,
}: {
  onOpenChange: (open: boolean) => void;
  onSelect: (value: DeckButtonColor) => void;
  open: boolean;
  value: DeckButtonColor;
}) {
  const selectedColor = getDeckButtonColor(value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Button Background</DialogTitle>
          <DialogDescription>
            Choose one shadcn color family for the button background.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {DECK_BUTTON_COLORS.map((color) => {
            const isSelected = color.value === selectedColor.value;

            return (
              <Button
                key={color.value}
                type="button"
                variant="outline"
                aria-pressed={isSelected}
                className={cn(
                  "h-auto justify-start gap-3 px-3 py-3 text-left",
                  color.bgClass,
                  color.textClass,
                  isSelected && "ring-2 ring-ring ring-offset-2",
                )}
                onClick={() => {
                  onSelect(color.value);
                  onOpenChange(false);
                }}
              >
                <span aria-hidden="true" className="size-3 rounded-full border border-white/50 bg-current" />
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate font-medium">{color.label}</span>
                  {isSelected ? <CheckIcon aria-hidden="true" data-icon="inline-end" /> : null}
                </span>
              </Button>
            );
          })}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
