import { useEffect, useRef } from "react";

import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
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
  FieldGroup,
  FieldLabel,
} from "../../components/ui/field";
import { Input } from "../../components/ui/input";

type ImportPreview = {
  deckName: string;
  gridLabel: string;
  buttonCountLabel: string;
  hasConnection: boolean;
};

export function ImportExportPanel({
  error,
  preview,
  onExport,
  onImportFile,
  onCancelPreview,
  onConfirmPreview,
}: {
  error?: string;
  preview?: ImportPreview;
  onExport: () => void;
  onImportFile: (file: File) => Promise<void>;
  onCancelPreview: () => void;
  onConfirmPreview: () => Promise<void>;
}) {
  const previewConfirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (preview) {
      previewConfirmButtonRef.current?.focus();
    }
  }, [preview]);

  return (
    <Card className="rounded-[1.75rem] border border-border/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Deck transfer
        </p>
        <CardTitle className="font-display text-3xl text-[--color-ink]">Import / export</CardTitle>
        <CardDescription>
          Back up the current deck as a `.webdeck.json` file or preview a new file before replacing saved local data.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="sm:flex-1" variant="secondary" onClick={onExport}>
            Export deck
          </Button>
          <FieldGroup className="sm:flex-1">
            <Field>
              <FieldLabel htmlFor="deck-import-file">Import deck file</FieldLabel>
              <FieldContent>
                <Input
                  id="deck-import-file"
                  accept=".json,.webdeck.json,application/json"
                  type="file"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (!file) {
                      return;
                    }

                    void onImportFile(file);
                    event.currentTarget.value = "";
                  }}
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Import failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {preview ? (
          <Card
            aria-label="Import preview"
            className="border border-border/70 bg-[--color-surface] shadow-none"
            role="dialog"
            size="sm"
          >
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Preview
              </p>
              <CardTitle className="text-2xl font-semibold text-[--color-ink]">{preview.deckName}</CardTitle>
              <CardDescription>{preview.gridLabel}</CardDescription>
              <CardDescription>{preview.buttonCountLabel}</CardDescription>
              <CardDescription>
                {preview.hasConnection ? "Connection settings included" : "No connection settings included"}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex gap-3">
              <Button
                ref={previewConfirmButtonRef}
                className="flex-1"
                onClick={() => void onConfirmPreview()}
              >
                Replace current deck
              </Button>
              <Button className="flex-1" variant="secondary" onClick={onCancelPreview}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </CardContent>
    </Card>
  );
}
