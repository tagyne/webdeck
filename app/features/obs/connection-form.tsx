import { useEffect } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
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
import type { ReactNode } from "react";
import type { ObsConnectionSettings, ObsConnectionStatus } from "./types";

type ConnectionFormValues = {
  host: string;
  port: number;
  password: string;
};

export function ConnectionForm({
  formId = "obs-connection-form",
  connectionStatus,
  defaultValues,
  error,
  hasConnection,
  isLoading,
  isSubmitting,
  onCancel,
  onSubmit,
  statusBadge,
  unavailableAlert,
}: {
  formId?: string;
  connectionStatus: ObsConnectionStatus;
  defaultValues?: ObsConnectionSettings;
  error?: string;
  hasConnection: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: ObsConnectionSettings) => Promise<void>;
  statusBadge: ReactNode;
  unavailableAlert?: ReactNode;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConnectionFormValues>({
    defaultValues: {
      host: defaultValues?.host ?? "",
      port: defaultValues?.port ?? 4455,
      password: defaultValues?.password ?? "",
    },
  });

  useEffect(() => {
    reset({
      host: defaultValues?.host ?? "",
      port: defaultValues?.port ?? 4455,
      password: defaultValues?.password ?? "",
    });
  }, [defaultValues, reset]);

  const submit: SubmitHandler<ConnectionFormValues> = async (values) => {
    await onSubmit({
      host: values.host.trim(),
      port: Number(values.port),
      ...(values.password ? { password: values.password } : {}),
    });
  };

  return (
    <form
      className="flex max-h-[calc(100vh-8rem)] flex-col gap-6"
      id={formId}
      onSubmit={handleSubmit(submit)}
    >
      <DialogHeader>
        <div className="flex items-start justify-between gap-3 pr-10">
          <div className="flex min-w-0 flex-col gap-2">
            <DialogTitle>OBS connection</DialogTitle>
            <DialogDescription>
              Configure the local OBS WebSocket endpoint so the deck can stay focused on live controls.
            </DialogDescription>
          </div>
          {statusBadge}
        </div>
      </DialogHeader>

      <div className="grid min-h-0 gap-6 overflow-y-auto">
        {unavailableAlert}

        {isLoading ? (
          <div className="px-1 py-2 text-sm text-muted-foreground">Loading saved connection settings…</div>
        ) : (
          <FieldSet>
            <FieldGroup>
              <Field data-invalid={Boolean(errors.host)}>
                <FieldLabel htmlFor="obs-host">Host</FieldLabel>
                <FieldContent>
                  <Input
                    aria-invalid={Boolean(errors.host)}
                    autoComplete="off"
                    autoFocus
                    id="obs-host"
                    placeholder="192.168.1.20"
                    {...register("host", {
                      required: "Host is required.",
                    })}
                  />
                  <FieldError errors={[errors.host]} />
                </FieldContent>
              </Field>

              <Field data-invalid={Boolean(errors.port)}>
                <FieldLabel htmlFor="obs-port">Port</FieldLabel>
                <FieldContent>
                  <Input
                    aria-invalid={Boolean(errors.port)}
                    id="obs-port"
                    inputMode="numeric"
                    placeholder="4455"
                    {...register("port", {
                      required: "Port is required.",
                      valueAsNumber: true,
                      min: {
                        value: 1,
                        message: "Port must be greater than 0.",
                      },
                    })}
                  />
                  <FieldError errors={[errors.port]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="obs-password">Password</FieldLabel>
                <FieldContent>
                  <Input
                    autoComplete="off"
                    id="obs-password"
                    placeholder="Optional unless OBS requires it"
                    type="password"
                    {...register("password")}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
          </FieldSet>
        )}

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Connection failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      <DialogFooter className="items-stretch sm:items-center sm:justify-end">
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button className="sm:min-w-32" type="button" variant="outline" onClick={onCancel}>
            Close
          </Button>
          <Button className="sm:min-w-32" type="submit" disabled={isLoading || isSubmitting}>
            {isSubmitting
              ? "Connecting…"
              : connectionStatus === "connected" && hasConnection
                ? "Update OBS"
                : "Connect OBS"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
