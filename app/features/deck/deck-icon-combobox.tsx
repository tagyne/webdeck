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
  const [open, setOpen] = useState(false);
  const [iconsPerRow, setIconsPerRow] = useState(6);
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
  }, [filteredIcons, iconsPerRow]);

  // TanStack Virtual is intentionally used here for the icon grid viewport.
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: iconRows.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 64,
    initialRect: { height: 500, width: iconsPerRow === 5 ? 352 : 430 },
    overscan: 3,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 52.8124rem)");

    const syncIconsPerRow = () => {
      setIconsPerRow(mediaQuery.matches ? 5 : 6);
    };

    syncIconsPerRow();
    mediaQuery.addEventListener("change", syncIconsPerRow);

    return () => mediaQuery.removeEventListener("change", syncIconsPerRow);
  }, []);

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
            <InputGroup
              aria-controls={`${id}-popover`}
              aria-expanded={open}
              aria-haspopup="dialog"
              id={id}
              className={cn(
                "w-full cursor-pointer gap-0 outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                open && "border-ring ring-3 ring-ring/50",
                ariaInvalid && "border-destructive ring-destructive/20",
                disabled && "pointer-events-none opacity-50",
              )}
            >
              <InputGroupAddon align="inline-start">
                <LucideIcon aria-hidden="true" name={value} />
              </InputGroupAddon>
              <div
                aria-invalid={ariaInvalid}
                className="flex min-w-0 flex-1 items-center px-2.5 text-sm"
                data-slot="input-group-control"
              >
                <span className="truncate font-medium">{value}</span>
              </div>
              <InputGroupAddon align="inline-end">
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>
          }
        />

        <PopoverContent
          align="start"
          className="h-[500px] w-[22rem] deck-tablet:w-[27rem] p-4"
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
                              "relative size-14 p-0 text-center shadow-none [content-visibility:auto]",
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
