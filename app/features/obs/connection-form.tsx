import { useEffect } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../../components/ui/field";
import { Input } from "../../components/ui/input";
import type { ObsConnectionSettings } from "./types";

type ConnectionFormValues = {
  host: string;
  port: number;
  password: string;
};

export function ConnectionForm({
  defaultValues,
  isSubmitting,
  error,
  onSubmit,
}: {
  defaultValues?: ObsConnectionSettings;
  isSubmitting: boolean;
  error?: string;
  onSubmit: (values: ObsConnectionSettings) => Promise<void>;
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
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(submit)}>
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
              id="obs-password"
              placeholder="Optional unless OBS requires it"
              type="password"
              {...register("password")}
            />
          </FieldContent>
        </Field>
      </FieldGroup>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Connection failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button className="w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Connecting..." : "Connect OBS"}
      </Button>
    </form>
  );
}
