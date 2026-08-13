import { getDeckSlotCount, type DeckConfig } from "./types";
import { DeckButton } from "./deck-button";
import type { ObsState } from "../obs/types";
import { cn } from "../../lib/utils";

export function DeckGrid({
  deck,
  activeSlot,
  obsState,
  onPressSlot,
  className,
}: {
  deck: DeckConfig;
  activeSlot?: number | null;
  obsState: ObsState;
  onPressSlot: (slot: number) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("grid h-full gap-3 sm:gap-4", className)}
      style={{
        gridTemplateColumns: `repeat(${deck.grid.columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${deck.grid.rows}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: getDeckSlotCount(deck.grid) }, (_, slot) => {
        const button = deck.buttons.find((item) => item.slot === slot);

        return (
          <DeckButton
            key={slot}
            slot={slot}
            button={button}
            isBusy={activeSlot === slot}
            obsState={obsState}
            onPress={() => onPressSlot(slot)}
          />
        );
      })}
    </div>
  );
}
