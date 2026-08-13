import { useEffect, useRef } from "react";

import { Button } from "../../components/ui/button";

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
    <section className="rounded-[1.75rem] border border-[--color-line] bg-white/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Deck transfer
        </p>
        <h2 className="font-display text-3xl text-[--color-ink]">Import / export</h2>
        <p className="text-sm leading-6 text-slate-600">
          Back up the current deck as a `.webdeck.json` file or preview a new file before replacing saved local data.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button className="sm:flex-1" variant="secondary" onClick={onExport}>
          Export deck
        </Button>
        <div className="sm:flex-1">
          <label className="block text-sm font-medium text-slate-700" htmlFor="deck-import-file">
            Import deck file
          </label>
          <input
            id="deck-import-file"
            accept=".json,.webdeck.json,application/json"
            className="mt-2 block w-full rounded-2xl border border-[--color-line] bg-white px-4 py-3 text-sm text-[--color-ink] file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
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
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      {preview ? (
        <section
          aria-label="Import preview"
          className="mt-5 rounded-[1.5rem] border border-[--color-line] bg-[--color-surface] p-5"
          role="dialog"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Preview
            </p>
            <h3 className="text-2xl font-semibold text-[--color-ink]">{preview.deckName}</h3>
            <p className="text-sm text-slate-600">{preview.gridLabel}</p>
            <p className="text-sm text-slate-600">{preview.buttonCountLabel}</p>
            <p className="text-sm text-slate-600">
              {preview.hasConnection ? "Connection settings included" : "No connection settings included"}
            </p>
          </div>

          <div className="mt-5 flex gap-3">
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
          </div>
        </section>
      ) : null}
    </section>
  );
}
