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
      className={cn("grid w-full content-start justify-start gap-4", className)}
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 11rem))",
        gridAutoRows: "11rem",
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
