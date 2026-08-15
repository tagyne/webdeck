import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "../../components/ui/card";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "../../components/ui/field";
import { Input } from "../../components/ui/input";

export function ImportExportPanel({
  error,
  showExport = true,
  onExport,
  onImportFile,
}: {
  error?: string;
  showExport?: boolean;
  onExport: () => void;
  onImportFile: (file: File) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Deck transfer
        </p>
        <CardTitle className="text-3xl">Import / export</CardTitle>
        <CardDescription>
          Back up the current deck as a `.webdeck.json` file or preview a new file before replacing saved local data.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          {showExport ? (
            <Button className="sm:flex-1" variant="secondary" onClick={onExport}>
              Export deck
            </Button>
          ) : null}
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
      </CardContent>
    </Card>
  );
}
