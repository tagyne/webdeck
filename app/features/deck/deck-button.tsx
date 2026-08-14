import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { LucideIcon } from "./lucide-icon";
import type { DeckButton as DeckButtonModel } from "./types";

export function DeckButton({
  slot,
  button,
  isBusy,
  onPress,
}: {
  slot: number;
  button?: DeckButtonModel;
  isBusy?: boolean;
  onPress: () => void;
}) {
  const accessibleName = button
    ? `Slot ${slot + 1}: ${button.label}`
    : `Slot ${slot + 1}: Empty slot`;

  return (
    <Button
      aria-label={accessibleName}
      variant="outline"
      className={cn(
        "h-full w-full items-stretch rounded-[1.75rem] p-0 text-left shadow-none",
        button
          ? "bg-background hover:bg-background"
          : "border-dashed bg-muted/20 text-muted-foreground hover:bg-muted/30",
      )}
      style={button
        ? {
            backgroundColor: `color-mix(in oklch, ${button.color} 16%, var(--background))`,
            borderColor: `color-mix(in oklch, ${button.color} 40%, var(--border))`,
          }
        : undefined}
      disabled={isBusy}
      onClick={onPress}
    >
      {button ? (
        <div
          className="flex h-full min-h-0 flex-col items-center justify-between rounded-[calc(1.75rem-2px)] p-5 text-center"
        >
          <div
            className="flex size-12 items-center justify-center rounded-xl border bg-background/80"
            style={{
              borderColor: `color-mix(in oklch, ${button.color} 35%, var(--border))`,
              color: button.color,
            }}
          >
            <LucideIcon className="h-6 w-6" name={button.icon.name} />
          </div>
          <p className="text-lg font-semibold leading-tight">{button.label}</p>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-[calc(1.75rem-2px)]">
          <span aria-hidden="true" className="text-5xl font-light leading-none text-muted-foreground">
            +
          </span>
          <span className="sr-only">Add button to empty slot {slot + 1}</span>
        </div>
      )}
    </Button>
  );
}
