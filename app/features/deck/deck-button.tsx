import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { LucideIcon } from "./lucide-icon";
import type { DeckButton as DeckButtonModel } from "./types";
import type { ObsState } from "../obs/types";
import { getDeckButtonStateMeta } from "./deck-button-state";

const iconSizeClassMap = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
} as const;

export function DeckButton({
  slot,
  button,
  isBusy,
  obsState,
  onPress,
}: {
  slot: number;
  button?: DeckButtonModel;
  isBusy?: boolean;
  obsState?: ObsState;
  onPress: () => void;
}) {
  const buttonLabel = button?.label.trim();
  const accessibleName = button
    ? `Slot ${slot + 1}: ${buttonLabel || button.icon.name}`
    : `Slot ${slot + 1}: Empty slot`;
  const stateMeta = button && obsState ? getDeckButtonStateMeta(button, obsState) : undefined;
  const isDisabled = Boolean(isBusy || stateMeta?.isDisabled);

  return (
    <Button
      aria-label={accessibleName}
      aria-pressed={stateMeta?.isToggle ? stateMeta.isActive : undefined}
      variant="outline"
      className={cn(
        "h-full w-full items-stretch rounded-[1.75rem] p-0 text-left shadow-none",
        button
          ? "bg-background hover:bg-muted/60"
          : "border-dashed bg-background text-foreground hover:bg-muted/60",
        stateMeta?.isActive && "bg-muted border-foreground/20 shadow-inner",
        stateMeta && !stateMeta.isActive && !stateMeta.isDisabled && "opacity-80",
      )}
      disabled={isDisabled}
      onClick={onPress}
    >
      {button ? (
        <div
          className="flex h-full min-h-0 flex-col items-center justify-center gap-3 rounded-[calc(1.75rem-2px)] p-5 text-center"
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
        <div className="flex h-full w-full items-center justify-center rounded-[calc(1.75rem-2px)]">
          <span aria-hidden="true" className="flex size-10 items-center justify-center text-5xl font-light leading-none text-muted-foreground">
            +
          </span>
          <span className="sr-only">Add button to empty slot {slot + 1}</span>
        </div>
      )}
    </Button>
  );
}
