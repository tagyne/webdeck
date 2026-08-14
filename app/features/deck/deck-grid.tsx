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
  const sortedButtons = [...deck.buttons].sort((left, right) => left.slot - right.slot);
  const totalSlots = getDeckSlotCount(deck.grid);
  const nextSlot = sortedButtons.length < totalSlots ? sortedButtons.length : null;

  return (
    <div
      className={cn("grid w-full content-start justify-start gap-4", className)}
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 11rem))",
        gridAutoRows: "11rem",
      }}
    >
      {sortedButtons.map((button) => (
        <DeckButton
          key={button.slot}
          slot={button.slot}
          button={button}
          isBusy={activeSlot === button.slot}
          obsState={obsState}
          onPress={() => onPressSlot(button.slot)}
        />
      ))}
      {nextSlot !== null ? (
        <DeckButton
          key={`placeholder-${nextSlot}`}
          slot={nextSlot}
          isBusy={activeSlot === nextSlot}
          obsState={obsState}
          onPress={() => onPressSlot(nextSlot)}
        />
      ) : null}
    </div>
  );
}
