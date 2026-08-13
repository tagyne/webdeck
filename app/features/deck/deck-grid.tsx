import { getDeckSlotCount, type DeckConfig } from "./types";
import { DeckButton } from "./deck-button";
import type { ObsState } from "../obs/types";

export function DeckGrid({
  deck,
  activeSlot,
  obsState,
  onPressSlot,
}: {
  deck: DeckConfig;
  activeSlot?: number | null;
  obsState: ObsState;
  onPressSlot: (slot: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
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
