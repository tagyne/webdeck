import { useEffect, useRef } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
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
    <section
      aria-label={`Edit slot ${slot + 1}`}
      className="rounded-[1.75rem] border border-[--color-line] bg-white/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
      role="region"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Deck editor
          </p>
          <h2 className="mt-2 font-display text-3xl text-[--color-ink]">
            Edit slot {slot + 1}
          </h2>
        </div>
        <Button variant="secondary" onClick={onCancel}>
          Close
        </Button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <div className="space-y-2">
          <Label htmlFor="button-label">Label</Label>
          <Input
            id="button-label"
            {...labelField}
            ref={(element) => {
              labelField.ref(element);
              labelInputRef.current = element;
            }}
          />
          {errors.label ? <p className="text-sm text-red-700">{errors.label.message}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="button-icon">Icon</Label>
            <select
              id="button-icon"
              className="w-full rounded-2xl border border-[--color-line] bg-white px-4 py-3 text-sm text-[--color-ink]"
              {...register("iconName", {
                required: true,
              })}
            >
              {WEBDECK_ICON_ALLOWLIST.map((iconName) => (
                <option key={iconName} value={iconName}>
                  {iconName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="button-color">Color</Label>
            <Input
              id="button-color"
              type="color"
              className="h-12 p-2"
              {...register("color", {
                required: true,
              })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="button-action-type">Action type</Label>
          <select
            id="button-action-type"
            className="w-full rounded-2xl border border-[--color-line] bg-white px-4 py-3 text-sm text-[--color-ink]"
            {...register("actionType")}
          >
            {OBS_ACTION_TYPES.map((actionTypeOption) => (
              <option key={actionTypeOption} value={actionTypeOption}>
                {actionTypeOption}
              </option>
            ))}
          </select>
        </div>

        {actionType === "toggleInputMute" ? (
          <div className="space-y-2">
            <Label htmlFor="action-input-name">Input name</Label>
            <Input
              id="action-input-name"
              {...register("inputName", {
                validate: (value) =>
                  actionType !== "toggleInputMute" || value.trim().length > 0 || "Input name is required.",
              })}
            />
            {errors.inputName ? <p className="text-sm text-red-700">{errors.inputName.message}</p> : null}
          </div>
        ) : null}

        {actionType === "setCurrentProgramScene" || actionType === "toggleSourceVisibility" ? (
          <div className="space-y-2">
            <Label htmlFor="action-scene-name">Scene name</Label>
            <Input
              id="action-scene-name"
              {...register("sceneName", {
                validate: (value) =>
                  actionType === "setCurrentProgramScene" || actionType === "toggleSourceVisibility"
                    ? value.trim().length > 0 || "Scene name is required."
                    : true,
              })}
            />
            {errors.sceneName ? <p className="text-sm text-red-700">{errors.sceneName.message}</p> : null}
          </div>
        ) : null}

        {actionType === "toggleSourceVisibility" ? (
          <div className="space-y-2">
            <Label htmlFor="action-source-name">Source name</Label>
            <Input
              id="action-source-name"
              {...register("sourceName", {
                validate: (value) =>
                  actionType !== "toggleSourceVisibility" || value.trim().length > 0 || "Source name is required.",
              })}
            />
            {errors.sourceName ? <p className="text-sm text-red-700">{errors.sourceName.message}</p> : null}
          </div>
        ) : null}

        <div className="flex gap-3">
          <Button className="flex-1" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save button"}
          </Button>
          <Button className="flex-1" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
