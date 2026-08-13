import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { LucideIcon } from "./lucide-icon";
import type { DeckButton as DeckButtonModel } from "./types";
import type { ObsState } from "../obs/types";
import { getDeckButtonStateLabel } from "./deck-button-state";

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
  const accessibleName = button
    ? `Slot ${slot + 1}: ${button.label}`
    : `Slot ${slot + 1}: Empty slot`;
  const stateLabel = button && obsState ? getDeckButtonStateLabel(button, obsState) : undefined;

  return (
    <Button
      aria-label={accessibleName}
      variant={button ? "secondary" : "ghost"}
      className={cn(
        "h-full min-h-0 w-full items-stretch rounded-[1.6rem] p-0 text-left",
        button
          ? "border border-slate-900/8 bg-white text-[--color-ink] shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
          : "border border-dashed border-white/12 bg-white/6 text-slate-300",
      )}
      disabled={isBusy}
      onClick={onPress}
    >
      {button ? (
        <div
          className="flex h-full min-h-0 flex-col justify-between rounded-[1.45rem] p-4"
          style={{
            background:
              `linear-gradient(180deg, ${button.color}20 0%, rgba(255,255,255,0.98) 100%)`,
          }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${button.color}22`, color: button.color }}
          >
            <LucideIcon className="h-6 w-6" name={button.icon.name} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Slot {slot + 1}
            </p>
            <p className="text-lg font-semibold leading-tight">{button.label}</p>
            {stateLabel ? (
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {stateLabel}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col justify-between rounded-[1.45rem] border border-dashed border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Slot {slot + 1}
          </p>
          <p className="text-sm text-slate-400">Empty slot</p>
        </div>
      )}
    </Button>
  );
}
