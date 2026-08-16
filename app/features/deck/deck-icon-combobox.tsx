import { useEffect, useId, useMemo, useRef, useState } from "react";
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
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (open) {
      searchInputRef.current?.focus();
    }
  }, [open]);

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
          className="p-4"
          id={`${id}-popover`}
          style={{ width: "400px" }}
        >
          <div className="flex flex-col gap-3">
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
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div
                  className="flex flex-wrap gap-2"
                  style={{ height: "500px" }}
                >
                  {filteredIcons.map((iconName) => {
                    const isSelected = iconName === value;

                    return (
                      <Button
                        key={iconName}
                        aria-label={`Select ${iconName} icon`}
                        type="button"
                        variant={isSelected ? "secondary" : "outline"}
                        className={cn(
                          "relative min-h-24 w-[calc(25%-0.375rem)] min-w-[calc(25%-0.375rem)] px-2 py-3 text-center shadow-none [content-visibility:auto]",
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
