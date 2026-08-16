import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { DeckConfig } from "./types";
import { DeckButton } from "./deck-button";
import { reorderDeckButtons } from "./reorder-buttons";
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
  onReorder,
  obsState,
  onPressSlot,
  className,
}: {
  deck: DeckConfig;
  activeSlot?: number | null;
  isEditMode?: boolean;
  onDeleteSlot?: (slot: number) => void;
  onReorder?: (nextDeck: DeckConfig) => Promise<void>;
  obsState: ObsState;
  onPressSlot: (slot: number) => void;
  className?: string;
}) {
  const sortedButtons = useMemo(
    () => [...deck.buttons].sort((left, right) => left.slot - right.slot),
    [deck.buttons],
  );
  const [orderedButtonIds, setOrderedButtonIds] = useState<string[] | null>(null);
  const buttonIds = useMemo(() => sortedButtons.map((button) => button.id), [sortedButtons]);
  const buttonById = useMemo(
    () => new Map(sortedButtons.map((button) => [button.id, button])),
    [sortedButtons],
  );
  const canReorder = Boolean(isEditMode && onReorder && sortedButtons.length > 1);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const currentOrderedButtonIds = orderedButtonIds ?? buttonIds;

  const visibleButtons = isEditMode
    ? currentOrderedButtonIds
        .map((buttonId, index) => {
          const button = buttonById.get(buttonId);
          return button ? { ...button, slot: index } : undefined;
        })
        .filter((button) => button !== undefined)
    : sortedButtons;
  const nextSlot = isEditMode
    ? visibleButtons.length
    : getNextAvailableSlot(sortedButtons.map((button) => button.slot));

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || !onReorder) {
      return;
    }

    const oldIndex = currentOrderedButtonIds.indexOf(String(active.id));
    const newIndex = currentOrderedButtonIds.indexOf(String(over.id));

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextOrderedIds = [...currentOrderedButtonIds];
    const [movedId] = nextOrderedIds.splice(oldIndex, 1);
    nextOrderedIds.splice(newIndex, 0, movedId);
    setOrderedButtonIds(nextOrderedIds);

    try {
      await onReorder(reorderDeckButtons({
        deck,
        activeButtonId: String(active.id),
        overButtonId: String(over.id),
      }));
    } finally {
      setOrderedButtonIds(null);
    }
  };

  const grid = (
    <div
      className={cn(
        "grid w-full grid-cols-3 content-start gap-3 deck-tablet:grid-cols-6 deck-tablet:gap-4 deck-desktop:grid-cols-9",
        className,
      )}
    >
      {visibleButtons.map((button) => (
        canReorder ? (
          <SortableDeckButton
            key={button.id}
            button={button}
            isBusy={activeSlot === button.slot}
            isEditMode={isEditMode}
            onDelete={button ? () => onDeleteSlot?.(button.slot) : undefined}
            obsState={obsState}
            onPress={() => onPressSlot(button.slot)}
          />
        ) : (
          <DeckButton
            key={button.id}
            slot={button.slot}
            button={button}
            isBusy={activeSlot === button.slot}
            isEditMode={isEditMode}
            onDelete={button ? () => onDeleteSlot?.(button.slot) : undefined}
            obsState={obsState}
            onPress={() => onPressSlot(button.slot)}
          />
        )
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

  if (!canReorder) {
    return grid;
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragEnd={(event) => {
        void handleDragEnd(event);
      }}
    >
      <SortableContext items={currentOrderedButtonIds} strategy={rectSortingStrategy}>
        {grid}
      </SortableContext>
    </DndContext>
  );
}

function SortableDeckButton({
  button,
  isBusy,
  isEditMode,
  onDelete,
  obsState,
  onPress,
}: {
  button: DeckConfig["buttons"][number];
  isBusy?: boolean;
  isEditMode?: boolean;
  onDelete?: () => void;
  obsState: ObsState;
  onPress: () => void;
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: button.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <DeckButton
        slot={button.slot}
        button={button}
        dragHandleProps={{
          ...attributes,
          ...listeners,
          ref: setActivatorNodeRef,
        }}
        isBusy={isBusy}
        isDragging={isDragging}
        isEditMode={isEditMode}
        onDelete={onDelete}
        obsState={obsState}
        onPress={onPress}
      />
    </div>
  );
}
