import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../../components/ui/combobox";
import { FieldContent } from "../../components/ui/field";
import { InputGroupAddon } from "../../components/ui/input-group";
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
  return (
    <Combobox
      itemToStringValue={(iconName) => iconName}
      items={WEBDECK_ICON_NAMES}
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
          {(iconName) => (
            <ComboboxItem key={iconName} value={iconName}>
              <LucideIcon aria-hidden="true" name={iconName} />
              <FieldContent className="min-w-0">
                <span className="font-medium">{iconName}</span>
              </FieldContent>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
