import {
  ComboboxCollection,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
} from "../../components/ui/combobox";
import { FieldContent } from "../../components/ui/field";
import { InputGroupAddon } from "../../components/ui/input-group";
import { LucideIcon } from "./lucide-icon";
import { WEBDECK_ICON_ALLOWLIST, WEBDECK_ICON_GROUPS, type WebdeckIconName } from "./types";

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
  return (
    <Combobox
      itemToStringValue={(iconName) => iconName}
      items={WEBDECK_ICON_ALLOWLIST}
      value={value}
      onValueChange={(nextValue) => onValueChange((nextValue ?? "mic") as WebdeckIconName)}
    >
      <ComboboxInput
        aria-invalid={ariaInvalid}
        autoComplete="off"
        disabled={disabled}
        id={id}
        name={name}
        placeholder="Search an icon…"
      >
        <InputGroupAddon align="inline-start">
          <LucideIcon aria-hidden="true" className="text-muted-foreground" name={value} />
        </InputGroupAddon>
      </ComboboxInput>

      <ComboboxContent>
        <ComboboxEmpty>No icon found.</ComboboxEmpty>
        <ComboboxList>
          {WEBDECK_ICON_GROUPS.map((group, index) => (
            <div key={group.label}>
              <ComboboxGroup>
                <ComboboxLabel>{group.label}</ComboboxLabel>
                <ComboboxCollection items={group.icons}>
                  {(iconName) => (
                    <ComboboxItem key={iconName} value={iconName}>
                      <LucideIcon aria-hidden="true" name={iconName} />
                      <FieldContent className="min-w-0">
                        <span className="font-medium">{iconName}</span>
                      </FieldContent>
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
              {index < WEBDECK_ICON_GROUPS.length - 1 ? <ComboboxSeparator /> : null}
            </div>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
