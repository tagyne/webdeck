import { useEffect, useRef } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../../components/ui/field";
import { Input } from "../../components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "../../components/ui/native-select";
import { OBS_ACTION_TYPES, WEBDECK_ICON_ALLOWLIST, type DeckButton, type DeckConfig } from "./types";
import type { DeckButtonAction } from "../obs/types";

type EditorFormValues = {
  label: string;
  iconName: string;
  color: string;
  actionType: DeckButtonAction["type"];
  inputName: string;
  sceneName: string;
  sourceName: string;
};

function getInitialValues(slot: number, button?: DeckButton): EditorFormValues {
  const action = button?.action;

  return {
    label: button?.label ?? "",
    iconName: button?.icon.name ?? "mic",
    color: button?.color ?? "#2563eb",
    actionType: action?.type ?? "toggleInputMute",
    inputName: action?.type === "toggleInputMute" ? action.inputName : "",
    sceneName:
      action?.type === "setCurrentProgramScene" || action?.type === "toggleSourceVisibility"
        ? action.sceneName
        : "",
    sourceName: action?.type === "toggleSourceVisibility" ? action.sourceName : "",
  };
}

function createAction(values: EditorFormValues): DeckButtonAction {
  switch (values.actionType) {
    case "toggleInputMute":
      return {
        type: "toggleInputMute",
        inputName: values.inputName.trim(),
      };
    case "setCurrentProgramScene":
      return {
        type: "setCurrentProgramScene",
        sceneName: values.sceneName.trim(),
      };
    case "toggleSourceVisibility":
      return {
        type: "toggleSourceVisibility",
        sceneName: values.sceneName.trim(),
        sourceName: values.sourceName.trim(),
      };
    case "startStream":
      return { type: "startStream" };
    case "stopStream":
      return { type: "stopStream" };
    case "toggleRecordPause":
      return { type: "toggleRecordPause" };
  }
}

function upsertButton({
  deck,
  slot,
  button,
}: {
  deck: DeckConfig;
  slot: number;
  button: DeckButton;
}) {
  const nextButtons = deck.buttons.filter((item) => item.slot !== slot);
  nextButtons.push(button);
  nextButtons.sort((left, right) => left.slot - right.slot);

  return {
    ...deck,
    buttons: nextButtons,
    updatedAt: new Date().toISOString(),
  };
}

export function ButtonEditor({
  deck,
  slot,
  button,
  onCancel,
  onSave,
}: {
  deck: DeckConfig;
  slot: number;
  button?: DeckButton;
  onCancel: () => void;
  onSave: (nextDeck: DeckConfig) => Promise<void>;
}) {
  const labelInputRef = useRef<HTMLInputElement>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditorFormValues>({
    defaultValues: getInitialValues(slot, button),
  });

  const actionType = useWatch({
    control,
    name: "actionType",
    defaultValue: button?.action.type ?? "toggleInputMute",
  });
  const labelField = register("label", {
    required: "Label is required.",
  });

  useEffect(() => {
    labelInputRef.current?.focus();
  }, []);

  const submit: SubmitHandler<EditorFormValues> = async (values) => {
    const nextDeck = upsertButton({
      deck,
      slot,
      button: {
        id: button?.id ?? `slot-${slot + 1}-${values.label.trim().toLowerCase().replace(/\s+/g, "-")}`,
        slot,
        label: values.label.trim(),
        icon: {
          type: "lucide",
          name: values.iconName as DeckButton["icon"]["name"],
        },
        color: values.color,
        action: createAction(values),
      },
    });

    await onSave(nextDeck);
  };

  return (
    <Card
      aria-label={`Edit slot ${slot + 1}`}
      role="region"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Deck editor
            </p>
            <CardTitle className="text-3xl">
              Edit slot {slot + 1}
            </CardTitle>
            <CardDescription>
              Configure the button label, icon, color, and OBS action for this slot.
            </CardDescription>
          </div>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Close
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.label)}>
              <FieldLabel htmlFor="button-label">Label</FieldLabel>
              <FieldContent>
                <Input
                  id="button-label"
                  {...labelField}
                  ref={(element) => {
                    labelField.ref(element);
                    labelInputRef.current = element;
                  }}
                />
                <FieldError errors={[errors.label]} />
              </FieldContent>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="button-icon">Icon</FieldLabel>
                <FieldContent>
                  <NativeSelect
                    id="button-icon"
                    {...register("iconName", {
                      required: true,
                    })}
                  >
                    {WEBDECK_ICON_ALLOWLIST.map((iconName) => (
                      <NativeSelectOption key={iconName} value={iconName}>
                        {iconName}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="button-color">Color</FieldLabel>
                <FieldContent>
                  <Input
                    id="button-color"
                    type="color"
                    className="h-12 p-2"
                    {...register("color", {
                      required: true,
                    })}
                  />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="button-action-type">Action type</FieldLabel>
              <FieldContent>
                <NativeSelect id="button-action-type" {...register("actionType")}>
                  {OBS_ACTION_TYPES.map((actionTypeOption) => (
                    <NativeSelectOption key={actionTypeOption} value={actionTypeOption}>
                      {actionTypeOption}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FieldContent>
            </Field>

            {actionType === "toggleInputMute" ? (
              <Field data-invalid={Boolean(errors.inputName)}>
                <FieldLabel htmlFor="action-input-name">Input name</FieldLabel>
                <FieldContent>
                  <Input
                    id="action-input-name"
                    {...register("inputName", {
                      validate: (value) =>
                        actionType !== "toggleInputMute" || value.trim().length > 0 || "Input name is required.",
                    })}
                  />
                  <FieldError errors={[errors.inputName]} />
                </FieldContent>
              </Field>
            ) : null}

            {actionType === "setCurrentProgramScene" || actionType === "toggleSourceVisibility" ? (
              <Field data-invalid={Boolean(errors.sceneName)}>
                <FieldLabel htmlFor="action-scene-name">Scene name</FieldLabel>
                <FieldContent>
                  <Input
                    id="action-scene-name"
                    {...register("sceneName", {
                      validate: (value) =>
                        actionType === "setCurrentProgramScene" || actionType === "toggleSourceVisibility"
                          ? value.trim().length > 0 || "Scene name is required."
                          : true,
                    })}
                  />
                  <FieldError errors={[errors.sceneName]} />
                </FieldContent>
              </Field>
            ) : null}

            {actionType === "toggleSourceVisibility" ? (
              <Field data-invalid={Boolean(errors.sourceName)}>
                <FieldLabel htmlFor="action-source-name">Source name</FieldLabel>
                <FieldContent>
                  <Input
                    id="action-source-name"
                    {...register("sourceName", {
                      validate: (value) =>
                        actionType !== "toggleSourceVisibility" || value.trim().length > 0 || "Source name is required.",
                    })}
                  />
                  <FieldError errors={[errors.sourceName]} />
                </FieldContent>
              </Field>
            ) : null}
          </FieldGroup>

          <div className="flex gap-3">
            <Button className="flex-1" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save button"}
            </Button>
            <Button className="flex-1" type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
