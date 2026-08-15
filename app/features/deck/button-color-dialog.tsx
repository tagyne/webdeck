import { CheckIcon } from "lucide-react";

import { Button } from "../../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../../components/ui/toggle-group";
import { cn } from "../../lib/utils";
import {
  DECK_BUTTON_COLORS,
  getDeckButtonColor,
  type DeckButtonColor,
} from "./button-colors";

export function ButtonColorDialog({
  id,
  onOpenChange,
  onSelect,
  open,
  value,
}: {
  id: string;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: DeckButtonColor) => void;
  open: boolean;
  value: DeckButtonColor;
}) {
  const selectedColor = getDeckButtonColor(value);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={(
          <Button
            id={id}
            type="button"
            variant="outline"
            className="w-full justify-start gap-3"
          />
        )}
      >
        <span
          aria-hidden="true"
          className={cn("size-4 rounded-full border border-border", selectedColor.bgClass)}
        />
        <span>{selectedColor.label}</span>
      </PopoverTrigger>

      <PopoverContent className="w-fit p-2">
        <ToggleGroup
          aria-label="Button background color"
          className="grid grid-cols-4 gap-2"
          orientation="horizontal"
          value={[selectedColor.value]}
          onValueChange={(nextValue) => {
            const nextColor = nextValue[0];

            if (!nextColor) {
              return;
            }

            onSelect(nextColor as DeckButtonColor);
            onOpenChange(false);
          }}
        >
          {DECK_BUTTON_COLORS.map((color) => {
            const isSelected = color.value === selectedColor.value;

            return (
              <ToggleGroupItem
                key={color.value}
                variant="outline"
                value={color.value}
                aria-pressed={isSelected}
                aria-label={color.label}
                className={cn(
                  "size-8 rounded-full p-0",
                  color.bgClass,
                  color.textClass,
                )}
              >
                <span className="sr-only">{color.label}</span>
                {isSelected ? <CheckIcon aria-hidden="true" /> : null}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </PopoverContent>
    </Popover>
  );
}
