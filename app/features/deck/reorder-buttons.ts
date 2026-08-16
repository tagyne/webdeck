import { arrayMove } from "@dnd-kit/sortable";

import type { DeckConfig } from "./types";

export function reorderDeckButtons({
  deck,
  activeButtonId,
  overButtonId,
}: {
  deck: DeckConfig;
  activeButtonId: string;
  overButtonId: string;
}) {
  if (activeButtonId === overButtonId) {
    return deck;
  }

  const sortedButtons = [...deck.buttons].sort((left, right) => left.slot - right.slot);
  const activeIndex = sortedButtons.findIndex((button) => button.id === activeButtonId);
  const overIndex = sortedButtons.findIndex((button) => button.id === overButtonId);

  if (activeIndex < 0 || overIndex < 0) {
    return deck;
  }

  const reorderedButtons = arrayMove(sortedButtons, activeIndex, overIndex).map((button, index) => ({
    ...button,
    slot: index,
  }));

  return {
    ...deck,
    buttons: reorderedButtons,
    updatedAt: new Date().toISOString(),
  };
}
