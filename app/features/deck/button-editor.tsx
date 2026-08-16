import { useEffect, useMemo, useRef, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../../components/ui/field";
import { Input } from "../../components/ui/input";
import { LoadingButton } from "../../components/ui/loading-button";
import {
  NativeSelect,
  NativeSelectOption,
} from "../../components/ui/native-select";
import { Separator } from "../../components/ui/separator";
import { ButtonColorDialog } from "./button-color-dialog";
import { ConfirmActionCall } from "../confirm/confirm-action-call";
import { DeckButton as DeckButtonPreview } from "./deck-button";
import { type DeckButtonColor } from "./button-colors";
import { DeckIconCombobox } from "./deck-icon-combobox";
import {
  OBS_ACTION_TYPES,
  type DeckButton,
  type DeckConfig,
  type WebdeckIconName,
} from "./types";
import type { DeckButtonAction } from "../obs/types";

type EditorFormValues = {
  label: string;
  iconName: string;
  color: DeckButtonColor;
  actionType: DeckButtonAction["type"];
  inputName: string;
  sceneName: string;
  sourceName: string;
};

const ACTION_LABELS: Record<DeckButtonAction["type"], string> = {
  toggleInputMute: "Toggle input mute",
  setCurrentProgramScene: "Switch program scene",
  toggleSourceVisibility: "Toggle source visibility",
  startStream: "Start stream",
  stopStream: "Stop stream",
  toggleRecordPause: "Toggle record pause",
};

function getInitialValues(button?: DeckButton): EditorFormValues {
  const action = button?.action;

  return {
    label: button?.label ?? "",
    iconName: button?.icon.name ?? "mic",
    color: button?.color ?? "slate",
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

function removeButton({
  deck,
  slot,
}: {
  deck: DeckConfig;
  slot: number;
}) {
  return {
    ...deck,
    buttons: deck.buttons.filter((item) => item.slot !== slot),
    updatedAt: new Date().toISOString(),
  };
}

export function ButtonEditor({
  deck,
  slot,
  button,
  onCancel,
  onDelete,
  onSave,
}: {
  deck: DeckConfig;
  slot: number;
  button?: DeckButton;
  onCancel: () => void;
  onDelete: (nextDeck: DeckConfig) => Promise<void>;
  onSave: (nextDeck: DeckConfig) => Promise<void>;
}) {
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isColorDialogOpen, setIsColorDialogOpen] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditorFormValues>({
    defaultValues: getInitialValues(button),
  });

  const actionType = useWatch({
    control,
    name: "actionType",
    defaultValue: button?.action.type ?? "toggleInputMute",
  });
  const label = useWatch({
    control,
    name: "label",
    defaultValue: button?.label ?? "",
  });
  const iconName = useWatch({
    control,
    name: "iconName",
    defaultValue: button?.icon.name ?? "mic",
  });
  const color = useWatch({
    control,
    name: "color",
    defaultValue: button?.color ?? "slate",
  });
  const inputName = useWatch({
    control,
    name: "inputName",
    defaultValue: button?.action.type === "toggleInputMute" ? button.action.inputName : "",
  });
  const sceneName = useWatch({
    control,
    name: "sceneName",
    defaultValue:
      button?.action.type === "setCurrentProgramScene" || button?.action.type === "toggleSourceVisibility"
        ? button.action.sceneName
        : "",
  });
  const sourceName = useWatch({
    control,
    name: "sourceName",
    defaultValue: button?.action.type === "toggleSourceVisibility" ? button.action.sourceName : "",
  });
  const labelField = register("label");

  const previewButton = useMemo<DeckButton>(() => ({
    id: button?.id ?? `slot-${slot + 1}-preview`,
    slot,
    label: label.trim() || `Slot ${slot + 1}`,
    icon: {
      type: "lucide",
      name: iconName as DeckButton["icon"]["name"],
    },
    iconSize: button?.iconSize ?? "md",
    color,
    action: createAction({
      label,
      iconName,
      actionType,
      inputName,
      sceneName,
      sourceName,
    }),
  }), [actionType, button?.iconSize, button?.id, color, iconName, inputName, label, sceneName, slot, sourceName]);

  useEffect(() => {
    labelInputRef.current?.focus();
  }, []);

  const submit: SubmitHandler<EditorFormValues> = async (values) => {
    const trimmedLabel = values.label.trim();
    const generatedIdSuffix = trimmedLabel
      ? trimmedLabel.toLowerCase().replace(/\s+/g, "-")
      : `${values.iconName}-${values.actionType}`.toLowerCase();
    const nextDeck = upsertButton({
      deck,
      slot,
      button: {
        id: button?.id ?? `slot-${slot + 1}-${generatedIdSuffix}`,
        slot,
        label: trimmedLabel,
        icon: {
          type: "lucide",
          name: values.iconName as DeckButton["icon"]["name"],
        },
        iconSize: button?.iconSize ?? "md",
        color: values.color,
        action: createAction(values),
      },
    });

    await onSave(nextDeck);
  };

  const handleDelete = async () => {
    const accepted = await ConfirmActionCall.call({
      title: `Delete button in slot ${slot + 1}?`,
      description: "This removes the button configuration from the deck. This action cannot be undone.",
      confirmLabel: "Delete Button",
      confirmVariant: "destructive",
    });

    if (!accepted) {
      return;
    }

    setIsDeleting(true);

    try {
      await onDelete(removeButton({ deck, slot }));
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <>
      <form
        aria-label={`Edit slot ${slot + 1}`}
        className="flex max-h-[calc(100vh-8rem)] flex-col gap-6"
        onSubmit={handleSubmit(submit)}
      >
        <DialogHeader>
          <DialogTitle>{button ? `Edit Slot ${slot + 1}` : "Add Button"}</DialogTitle>
          <DialogDescription>
            Configure the icon, label, OBS action, and background color for this deck button.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 gap-6 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_1px_16rem]">
          <div className="flex flex-col gap-6">
            <FieldSet>
              <FieldGroup>
                <Field data-invalid={Boolean(errors.label)}>
                  <FieldLabel htmlFor="button-label">Label</FieldLabel>
                  <FieldContent>
                    <Input
                      id="button-label"
                      placeholder="Mic"
                      {...labelField}
                      aria-invalid={Boolean(errors.label)}
                      ref={(element) => {
                        labelField.ref(element);
                        labelInputRef.current = element;
                      }}
                    />
                    <FieldError errors={[errors.label]} />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="button-icon">Icon</FieldLabel>
                  <FieldContent>
                    <Controller
                      control={control}
                      name="iconName"
                      render={({ field }) => (
                        <DeckIconCombobox
                          ariaInvalid={false}
                          id="button-icon"
                          name={field.name}
                          value={field.value as WebdeckIconName}
                          onValueChange={field.onChange}
                        />
                      )}
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="button-color-trigger">Background color</FieldLabel>
                  <FieldContent>
                    <ButtonColorDialog
                      id="button-color-trigger"
                      open={isColorDialogOpen}
                      value={color}
                      onOpenChange={setIsColorDialogOpen}
                      onSelect={(nextColor) => {
                        setValue("color", nextColor, { shouldDirty: true });
                      }}
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="button-action-type">Action type</FieldLabel>
                  <FieldContent>
                    <NativeSelect className="w-full" id="button-action-type" {...register("actionType")}>
                      {OBS_ACTION_TYPES.map((actionTypeOption) => (
                        <NativeSelectOption key={actionTypeOption} value={actionTypeOption}>
                          {ACTION_LABELS[actionTypeOption]}
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
                        placeholder="Mic/Aux"
                        {...register("inputName", {
                          validate: (value) =>
                            actionType !== "toggleInputMute" || value.trim().length > 0 || "Input name is required.",
                        })}
                        aria-invalid={Boolean(errors.inputName)}
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
                        placeholder="Gameplay"
                        {...register("sceneName", {
                          validate: (value) =>
                            actionType === "setCurrentProgramScene" || actionType === "toggleSourceVisibility"
                              ? value.trim().length > 0 || "Scene name is required."
                              : true,
                        })}
                        aria-invalid={Boolean(errors.sceneName)}
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
                        placeholder="Camera"
                        {...register("sourceName", {
                          validate: (value) =>
                            actionType !== "toggleSourceVisibility" || value.trim().length > 0 || "Source name is required.",
                        })}
                        aria-invalid={Boolean(errors.sourceName)}
                      />
                      <FieldError errors={[errors.sourceName]} />
                    </FieldContent>
                  </Field>
                ) : null}
              </FieldGroup>
            </FieldSet>
          </div>

          <Separator
            aria-hidden="true"
            className="hidden lg:block"
            orientation="vertical"
          />

          <div className="flex flex-col gap-4">
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="aspect-square">
                  <DeckButtonPreview
                    slot={slot}
                    button={previewButton}
                    isBusy={false}
                    onPress={() => undefined}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="items-stretch sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {button ? (
              <LoadingButton
                type="button"
                variant="destructive"
                loading={isDeleting}
                loadingLabel="Removing…"
                onClick={handleDelete}
              >
                Remove button
              </LoadingButton>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button className="sm:min-w-32" type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <LoadingButton
              className="sm:min-w-32"
              type="submit"
              loading={isSubmitting}
              loadingLabel="Saving…"
            >
              {button ? "Save changes" : "Add button"}
            </LoadingButton>
          </div>
        </DialogFooter>
      </form>
    </>
  );
}
