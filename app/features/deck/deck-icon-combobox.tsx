import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CheckIcon, SearchIcon } from "lucide-react";

import { Button } from "../../components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../../components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { cn } from "../../lib/utils";
import { LucideIcon } from "./lucide-icon";
import { WEBDECK_ICON_NAMES, type WebdeckIconName } from "./types";

export function DeckIconCombobox({
  id,
  name,
  value,
  onValueChange,
  ariaInvalid = false,
  disabled = false,
}: {
  id: string;
  name: string;
  value: WebdeckIconName;
  onValueChange: (value: WebdeckIconName) => void;
  ariaInvalid?: boolean;
  disabled?: boolean;
}) {
  const iconsPerRow = 6;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputId = useId();

  const filteredIcons = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return WEBDECK_ICON_NAMES;
    }

    return WEBDECK_ICON_NAMES.filter((iconName) =>
      iconName.toLowerCase().includes(query),
    );
  }, [search]);

  const iconRows = useMemo(() => {
    const rows: WebdeckIconName[][] = [];

    for (let index = 0; index < filteredIcons.length; index += iconsPerRow) {
      rows.push(filteredIcons.slice(index, index + iconsPerRow));
    }

    return rows;
  }, [filteredIcons]);

  // TanStack Virtual is intentionally used here for the icon grid viewport.
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: iconRows.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 108,
    initialRect: { height: 500, width: 400 },
    overscan: 3,
  });

  useEffect(() => {
    if (open) {
      searchInputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (open && iconRows.length > 0) {
      const frameId = requestAnimationFrame(() => {
        rowVirtualizer.measure();
        rowVirtualizer.scrollToIndex(0, { align: "start" });
      });

      return () => cancelAnimationFrame(frameId);
    }
  }, [iconRows.length, open, rowVirtualizer]);

  return (
    <>
      <input readOnly hidden name={name} value={value} />

      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setSearch("");
          }
        }}
      >
        <PopoverTrigger
          render={
            <Button
              aria-controls={`${id}-popover`}
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-invalid={ariaInvalid}
              disabled={disabled}
              id={id}
              type="button"
              variant="outline"
              className={cn(
                "h-auto w-full justify-between gap-3 px-3 py-2 text-left shadow-none",
                "hover:bg-accent/50",
                ariaInvalid && "border-destructive",
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                  <LucideIcon aria-hidden="true" name={value} />
                </span>
                <span className="min-w-0 truncate font-medium">{value}</span>
              </span>
              <SearchIcon
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
            </Button>
          }
        />

        <PopoverContent
          align="start"
          className="h-[500px] w-[500px] p-4"
          id={`${id}-popover`}
        >
          <div className="flex h-full flex-col gap-3">
            <label className="sr-only" htmlFor={searchInputId}>
              Search icons
            </label>
            <InputGroup>
              <InputGroupInput
                ref={searchInputRef}
                autoComplete="off"
                id={searchInputId}
                placeholder="Search icons…"
                spellCheck={false}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>

            {filteredIcons.length > 0 ? (
              <div
                ref={listRef}
                className="min-h-0 flex-1 overflow-y-auto pr-1"
              >
                <div
                  className="relative w-full"
                  style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                    <div
                      key={virtualRow.key}
                      className="absolute top-0 left-0 flex w-full gap-2"
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {iconRows[virtualRow.index]?.map((iconName) => {
                        const isSelected = iconName === value;

                        return (
                          <Button
                            key={iconName}
                            aria-label={`Select ${iconName} icon`}
                            type="button"
                            variant={isSelected ? "secondary" : "outline"}
                            className={cn(
                              "relative min-h-24 flex-1 px-2 py-3 text-center shadow-none [content-visibility:auto]",
                              !isSelected && "hover:bg-accent/50",
                            )}
                            onClick={() => {
                              onValueChange(iconName);
                              setOpen(false);
                            }}
                          >
                            <LucideIcon aria-hidden="true" name={iconName} />
                            {isSelected ? (
                              <CheckIcon
                                aria-hidden="true"
                                className="absolute top-2 right-2 text-muted-foreground"
                              />
                            ) : null}
                          </Button>
                        );
                      })}
                      {iconRows[virtualRow.index] &&
                      iconRows[virtualRow.index].length < iconsPerRow
                        ? Array.from({
                            length: iconsPerRow - iconRows[virtualRow.index].length,
                          }).map((_, placeholderIndex) => (
                            <div
                              key={`placeholder-${virtualRow.index}-${placeholderIndex}`}
                              className="min-h-24 flex-1"
                            />
                          ))
                        : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No icon found.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
