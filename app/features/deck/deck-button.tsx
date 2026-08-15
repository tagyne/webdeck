import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { LucideIcon } from "./lucide-icon";
import type { DeckButton as DeckButtonModel } from "./types";
import type { ObsState } from "../obs/types";
import { getDeckButtonStateMeta } from "./deck-button-state";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

const iconSizeClassMap = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
} as const;

export function DeckButton({
  slot,
  button,
  isBusy,
  isEditMode,
  onDelete,
  obsState,
  onPress,
}: {
  slot: number;
  button?: DeckButtonModel;
  isBusy?: boolean;
  isEditMode?: boolean;
  onDelete?: () => void;
  obsState?: ObsState;
  onPress: () => void;
}) {
  const buttonLabel = button?.label.trim();
  const accessibleName = button
    ? `Slot ${slot + 1}: ${buttonLabel || button.icon.name}`
    : `Slot ${slot + 1}: Empty slot`;
  const stateMeta = button && obsState ? getDeckButtonStateMeta(button, obsState) : undefined;
  const isDisabled = !isEditMode && Boolean(isBusy || stateMeta?.isDisabled);

  return (
    <div className="relative h-full w-full">
      {isEditMode ? (
        <div className="pointer-events-none absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2">
          <span
            aria-hidden="true"
            className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/95 px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
          >
            {button ? <PencilIcon aria-hidden="true" /> : <PlusIcon aria-hidden="true" />}
            {button ? "Edit" : "Add"}
          </span>
          {button ? (
            <div className="pointer-events-auto flex items-center gap-1">
              <Button
                aria-label={`Delete button in slot ${slot + 1}`}
                size="icon-sm"
                variant="outline"
                onClick={() => {
                  onDelete?.();
                }}
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      <Button
        aria-label={accessibleName}
        aria-pressed={stateMeta?.isToggle ? stateMeta.isActive : undefined}
        variant="outline"
        className={cn(
          "h-full w-full items-stretch overflow-hidden rounded-[1.75rem] p-0 text-left shadow-none",
          button
            ? "bg-background hover:bg-muted/60"
            : "border-dashed bg-background text-foreground hover:bg-muted/60",
          stateMeta?.isActive && "bg-muted border-foreground/20 shadow-inner",
          stateMeta && !stateMeta.isActive && !stateMeta.isDisabled && "opacity-80",
          isEditMode && "border-primary/35 bg-muted/35 hover:border-primary/55 hover:bg-muted",
        )}
        disabled={isDisabled}
        onClick={onPress}
      >
        {button ? (
          <div
            className={cn(
              "flex h-full min-h-0 flex-col items-center justify-center gap-3 rounded-[calc(1.75rem-2px)] p-5 text-center",
              isEditMode && "pt-11",
            )}
          >
            <LucideIcon
              className={cn(iconSizeClassMap[button.iconSize ?? "md"], "text-foreground")}
              name={button.icon.name}
            />
            {buttonLabel ? (
              <p className="max-w-full truncate text-sm font-medium text-foreground">
                {buttonLabel}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-[calc(1.75rem-2px)] px-5 py-6 text-center">
            <span aria-hidden="true" className="flex size-10 items-center justify-center text-5xl font-light leading-none text-muted-foreground">
              +
            </span>
            {isEditMode ? (
              <span className="text-sm font-medium text-muted-foreground">Tap to add a button</span>
            ) : null}
            <span className="sr-only">Add button to empty slot {slot + 1}</span>
          </div>
        )}
      </Button>
    </div>
  );
}
