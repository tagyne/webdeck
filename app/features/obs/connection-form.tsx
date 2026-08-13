import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
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
    formState: { errors },
  } = useForm<ConnectionFormValues>({
    defaultValues: {
      host: defaultValues?.host ?? "",
      port: defaultValues?.port ?? 4455,
      password: defaultValues?.password ?? "",
    },
  });

  const submit: SubmitHandler<ConnectionFormValues> = async (values) => {
    await onSubmit({
      host: values.host.trim(),
      port: Number(values.port),
      ...(values.password ? { password: values.password } : {}),
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(submit)}>
      <div className="space-y-2">
        <Label htmlFor="obs-host">Host</Label>
        <Input
          id="obs-host"
          autoComplete="off"
          autoFocus
          placeholder="192.168.1.20"
          {...register("host", {
            required: "Host is required.",
          })}
        />
        {errors.host ? <p className="text-sm text-red-700">{errors.host.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="obs-port">Port</Label>
        <Input
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
        {errors.port ? <p className="text-sm text-red-700">{errors.port.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="obs-password">Password</Label>
        <Input
          id="obs-password"
          type="password"
          placeholder="Optional unless OBS requires it"
          {...register("password")}
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      <Button className="w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Connecting..." : "Connect OBS"}
      </Button>
    </form>
  );
}
