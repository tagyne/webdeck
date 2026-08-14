import {
  DECK_ICON_SIZES,
  DEFAULT_DECK_CONFIG,
  WEBDECK_ICON_ALLOWLIST,
  type DeckIconSize,
  type DeckButton,
  type DeckConfig,
  type DeckGrid,
  type IconRef,
} from "./types";
import {
  OBS_ACTION_TYPES,
  type DeckButtonAction,
  type ObsConnectionSettings,
} from "../obs/types";

export const WEBDECK_APP_ID = "webdeck";
export const WEBDECK_SCHEMA_VERSION = 1;
export const MAX_GRID_COLUMNS = 3;
export const MAX_GRID_ROWS = 3;

export type WebdeckExportAction =
  | { type: "toggleInputMute"; inputName: string }
  | { type: "setCurrentProgramScene"; sceneName: string }
  | { type: "toggleSourceVisibility"; sceneName: string; sourceName?: string }
  | { type: "startStream" }
  | { type: "stopStream" }
  | { type: "toggleRecordPause" };

export type WebdeckExportButton = {
  id: string;
  slot: number;
  label: string;
  icon: {
    type: string;
    name: string;
  };
  iconSize?: string;
  color: string;
  action: WebdeckExportAction;
};

export type WebdeckExportDeck = {
  id?: string;
  name: string;
  grid: DeckGrid;
  buttons: WebdeckExportButton[];
  updatedAt?: string;
};

export type WebdeckExportConnection = {
  host: string;
  port: number;
  password?: string;
  includePassword: boolean;
};

export type WebdeckExport = {
  schemaVersion: number;
  app: string;
  exportedAt: string;
  deck: WebdeckExportDeck;
  connection?: WebdeckExportConnection;
};

export type ParsedWebdeckImport = {
  schemaVersion: 1;
  app: "webdeck";
  exportedAt: string;
  deck: DeckConfig;
  connection?: ObsConnectionSettings;
};

export class DeckConfigValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(issues.join("; "));
    this.name = "DeckConfigValidationError";
    this.issues = issues;
  }
}

export function normalizeDeckExport(
  deck: DeckConfig,
  connection?: ObsConnectionSettings,
  includePassword = false,
): WebdeckExport {
  return {
    schemaVersion: WEBDECK_SCHEMA_VERSION,
    app: WEBDECK_APP_ID,
    exportedAt: new Date().toISOString(),
    deck: {
      name: deck.name,
      grid: deck.grid,
      buttons: deck.buttons.map((button) => ({
        id: button.id,
        slot: button.slot,
        label: button.label,
        icon: button.icon,
        iconSize: button.iconSize,
        color: button.color,
        action: button.action,
      })),
    },
    connection: connection
      ? {
          host: connection.host,
          port: connection.port,
          includePassword,
          ...(includePassword && connection.password
            ? { password: connection.password }
            : {}),
        }
      : undefined,
  };
}

export function parseWebdeckExport(input: unknown): ParsedWebdeckImport {
  const issues: string[] = [];

  if (!isRecord(input)) {
    throw new DeckConfigValidationError(["Import must be a JSON object."]);
  }

  if (input.app !== WEBDECK_APP_ID) {
    issues.push(`Expected app to be "${WEBDECK_APP_ID}".`);
  }

  if (input.schemaVersion !== WEBDECK_SCHEMA_VERSION) {
    issues.push(`Unsupported schema version: ${String(input.schemaVersion)}.`);
  }

  if (!isIsoString(input.exportedAt)) {
    issues.push("exportedAt must be an ISO timestamp string.");
  }

  const deck = parseDeck(input.deck, issues);
  const connection = input.connection === undefined
    ? undefined
    : parseConnection(input.connection, issues);

  if (issues.length > 0) {
    throw new DeckConfigValidationError(issues);
  }

  return {
    schemaVersion: WEBDECK_SCHEMA_VERSION,
    app: WEBDECK_APP_ID,
    exportedAt: input.exportedAt,
    deck,
    connection,
  };
}

function parseDeck(input: unknown, issues: string[]): DeckConfig {
  if (!isRecord(input)) {
    issues.push("deck must be an object.");
    return DEFAULT_DECK_CONFIG;
  }

  const grid = parseGrid(input.grid, issues);
  const buttons = parseButtons(input.buttons, grid, issues);

  return {
    id: isNonEmptyString(input.id) ? input.id : DEFAULT_DECK_CONFIG.id,
    name: isNonEmptyString(input.name) ? input.name : DEFAULT_DECK_CONFIG.name,
    grid,
    buttons,
    updatedAt: isIsoString(input.updatedAt) ? input.updatedAt : input.exportedAt ?? new Date(0).toISOString(),
  };
}

function parseGrid(input: unknown, issues: string[]): DeckGrid {
  if (!isRecord(input)) {
    issues.push("deck.grid must be an object.");
    return DEFAULT_DECK_CONFIG.grid;
  }

  const columns = typeof input.columns === "number" ? input.columns : NaN;
  const rows = typeof input.rows === "number" ? input.rows : NaN;

  if (!Number.isInteger(columns) || columns < 1 || columns > MAX_GRID_COLUMNS) {
    issues.push(`Grid columns must be an integer between 1 and ${MAX_GRID_COLUMNS}.`);
  }

  if (!Number.isInteger(rows) || rows < 1 || rows > MAX_GRID_ROWS) {
    issues.push(`Grid rows must be an integer between 1 and ${MAX_GRID_ROWS}.`);
  }

  return {
    columns: Number.isInteger(columns) ? columns : DEFAULT_DECK_CONFIG.grid.columns,
    rows: Number.isInteger(rows) ? rows : DEFAULT_DECK_CONFIG.grid.rows,
  };
}

function parseButtons(input: unknown, grid: DeckGrid, issues: string[]): DeckButton[] {
  if (!Array.isArray(input)) {
    issues.push("deck.buttons must be an array.");
    return [];
  }

  const seenIds = new Set<string>();
  const seenSlots = new Set<number>();
  return input.flatMap((item, index) => {
    if (!isRecord(item)) {
      issues.push(`Button at index ${index} must be an object.`);
      return [];
    }

    const id = isNonEmptyString(item.id) ? item.id : "";
    const slot = typeof item.slot === "number" ? item.slot : NaN;

    if (!id) {
      issues.push(`Button at index ${index} is missing an id.`);
    } else if (seenIds.has(id)) {
      issues.push(`Found duplicate button id "${id}".`);
    } else {
      seenIds.add(id);
    }

    if (!Number.isInteger(slot)) {
      issues.push(`Button "${id || index}" has an invalid slot.`);
    } else if (slot < 0) {
      issues.push(`Button slot ${slot} must be zero or greater.`);
    } else if (seenSlots.has(slot)) {
      issues.push(`Found duplicate button slot ${slot}.`);
    } else {
      seenSlots.add(slot);
    }

    const icon = parseIcon(item.icon, id || `button ${index}`, issues);
    const action = parseAction(item.action, id || `button ${index}`, issues);

    if (!isNonEmptyString(item.color)) {
      issues.push(`Button "${id || index}" is missing a color.`);
    }

    if (!id || !Number.isInteger(slot) || !icon || !action || !isNonEmptyString(item.color)) {
      return [];
    }

    return [
      {
        id,
        slot,
        label: typeof item.label === "string" ? item.label.trim() : "",
        icon,
        iconSize: parseIconSize(item.iconSize),
        color: item.color,
        action,
      },
    ];
  });
}

function parseIconSize(input: unknown): DeckIconSize {
  return typeof input === "string" && DECK_ICON_SIZES.includes(input as DeckIconSize)
    ? (input as DeckIconSize)
    : "md";
}

function parseIcon(input: unknown, buttonId: string, issues: string[]): IconRef | null {
  if (!isRecord(input)) {
    issues.push(`Button "${buttonId}" icon must be an object.`);
    return null;
  }

  if (input.type !== "lucide") {
    issues.push(`Button "${buttonId}" icon must use the "lucide" type.`);
    return null;
  }

  if (!isNonEmptyString(input.name) || !WEBDECK_ICON_ALLOWLIST.includes(input.name as IconRef["name"])) {
    issues.push(`Button "${buttonId}" uses an unsupported icon "${String(input.name)}".`);
    return null;
  }

  return {
    type: "lucide",
    name: input.name as IconRef["name"],
  };
}

function parseAction(input: unknown, buttonId: string, issues: string[]): DeckButtonAction | null {
  if (!isRecord(input) || !isNonEmptyString(input.type)) {
    issues.push(`Button "${buttonId}" action is missing a type.`);
    return null;
  }

  if (!OBS_ACTION_TYPES.includes(input.type as typeof OBS_ACTION_TYPES[number])) {
    issues.push(`Button "${buttonId}" action "${String(input.type)}" is not supported.`);
    return null;
  }

  switch (input.type) {
    case "toggleInputMute":
      if (!isNonEmptyString(input.inputName)) {
        issues.push(`Button "${buttonId}" action field inputName is required.`);
        return null;
      }
      return { type: input.type, inputName: input.inputName };

    case "setCurrentProgramScene":
      if (!isNonEmptyString(input.sceneName)) {
        issues.push(`Button "${buttonId}" action field sceneName is required.`);
        return null;
      }
      return { type: input.type, sceneName: input.sceneName };

    case "toggleSourceVisibility":
      if (!isNonEmptyString(input.sceneName)) {
        issues.push(`Button "${buttonId}" action field sceneName is required.`);
        return null;
      }
      if (!isNonEmptyString(input.sourceName)) {
        issues.push(`Button "${buttonId}" action field sourceName is required.`);
        return null;
      }
      return {
        type: input.type,
        sceneName: input.sceneName,
        sourceName: input.sourceName,
      };

    case "startStream":
    case "stopStream":
    case "toggleRecordPause":
      return { type: input.type };
  }
}

function parseConnection(input: unknown, issues: string[]): ObsConnectionSettings | undefined {
  if (!isRecord(input)) {
    issues.push("connection must be an object.");
    return undefined;
  }

  if (!isNonEmptyString(input.host)) {
    issues.push("connection.host is required.");
  }

  if (!Number.isInteger(input.port) || input.port <= 0) {
    issues.push("connection.port must be a positive integer.");
  }

  if (typeof input.includePassword !== "boolean") {
    issues.push("connection.includePassword must be a boolean.");
  }

  if (input.includePassword === true && !isNonEmptyString(input.password)) {
    issues.push("connection.password is required when includePassword is true.");
  }

  if (!isNonEmptyString(input.host) || !Number.isInteger(input.port) || input.port <= 0) {
    return undefined;
  }

  return {
    host: input.host,
    port: input.port,
    ...(isNonEmptyString(input.password) ? { password: input.password } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoString(value: unknown): value is string {
  return (
    typeof value === "string"
    && value.length > 0
    && !Number.isNaN(Date.parse(value))
  );
}
