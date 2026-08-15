import type { DeckConfig } from "./types";
import { DeckButton } from "./deck-button";
import type { ObsState } from "../obs/types";
import { cn } from "../../lib/utils";

function getNextAvailableSlot(slots: number[]) {
  const usedSlots = new Set(slots);
  let nextSlot = 0;

  while (usedSlots.has(nextSlot)) {
    nextSlot += 1;
  }

  return nextSlot;
}

export function DeckGrid({
  deck,
  activeSlot,
  isEditMode,
  onDeleteSlot,
  obsState,
  onPressSlot,
  className,
}: {
  deck: DeckConfig;
  activeSlot?: number | null;
  isEditMode?: boolean;
  onDeleteSlot?: (slot: number) => void;
  obsState: ObsState;
  onPressSlot: (slot: number) => void;
  className?: string;
}) {
  const sortedButtons = [...deck.buttons].sort((left, right) => left.slot - right.slot);
  const nextSlot = getNextAvailableSlot(sortedButtons.map((button) => button.slot));

  return (
    <div className={cn("grid w-full grid-cols-5 content-start gap-3 sm:gap-4", className)}>
      {sortedButtons.map((button) => (
        <DeckButton
          key={`${button.slot}-${isEditMode ? "edit" : "view"}`}
          slot={button.slot}
          button={button}
          isBusy={activeSlot === button.slot}
          isEditMode={isEditMode}
          onDelete={button ? () => onDeleteSlot?.(button.slot) : undefined}
          obsState={obsState}
          onPress={() => onPressSlot(button.slot)}
        />
      ))}
      <DeckButton
        key={`placeholder-${nextSlot}-${isEditMode ? "edit" : "view"}`}
        slot={nextSlot}
        isBusy={activeSlot === nextSlot}
        isEditMode={isEditMode}
        obsState={obsState}
        onPress={() => onPressSlot(nextSlot)}
      />
    </div>
  );
}
