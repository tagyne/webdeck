import {
  DeckConfigValidationError,
  normalizeDeckExport,
  parseWebdeckExport,
  type ParsedWebdeckImport,
  type WebdeckExport,
} from "./config-schema";
import type { DeckConfig } from "./types";
import type { ObsConnectionSettings } from "../obs/types";

export {
  DeckConfigValidationError,
};

export function parseWebdeckImport(input: unknown): ParsedWebdeckImport {
  return parseWebdeckExport(input);
}

export function parseWebdeckImportText(text: string) {
  return parseWebdeckImport(JSON.parse(text) as unknown);
}

export function serializeWebdeckExport({
  deck,
  connection,
  exportedAt,
  includePassword = false,
}: {
  deck: DeckConfig;
  connection?: ObsConnectionSettings;
  exportedAt?: string;
  includePassword?: boolean;
}) {
  const exportData = normalizeDeckExport(deck, connection, includePassword);
  const data: WebdeckExport = {
    ...exportData,
    exportedAt: exportedAt ?? exportData.exportedAt,
  };

  return `${JSON.stringify(data, null, 2)}\n`;
}

export function createWebdeckExportFilename(deckName: string) {
  const slug = deckName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "webdeck"}.webdeck.json`;
}
