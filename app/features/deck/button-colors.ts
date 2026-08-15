export const DECK_BUTTON_COLORS = [
  { value: "slate", label: "Slate", bgClass: "bg-slate-500", textClass: "text-white" },
  { value: "red", label: "Red", bgClass: "bg-red-500", textClass: "text-white" },
  { value: "orange", label: "Orange", bgClass: "bg-orange-500", textClass: "text-white" },
  { value: "yellow", label: "Yellow", bgClass: "bg-yellow-500", textClass: "text-slate-950" },
  { value: "green", label: "Green", bgClass: "bg-green-500", textClass: "text-white" },
  { value: "blue", label: "Blue", bgClass: "bg-blue-500", textClass: "text-white" },
  { value: "violet", label: "Violet", bgClass: "bg-violet-500", textClass: "text-white" },
] as const

export type DeckButtonColor = (typeof DECK_BUTTON_COLORS)[number]["value"]

const LEGACY_COLOR_MAP: Record<string, DeckButtonColor> = {
  slate: "slate",
  gray: "slate",
  zinc: "slate",
  neutral: "slate",
  stone: "slate",
  amber: "orange",
  lime: "yellow",
  emerald: "green",
  teal: "green",
  cyan: "blue",
  sky: "blue",
  indigo: "blue",
  purple: "violet",
  fuchsia: "violet",
  pink: "red",
  rose: "red",
  "#dc2626": "red",
  "#0f766e": "green",
  "#2563eb": "blue",
  "#ea580c": "orange",
  "#7c3aed": "violet",
}

export const DEFAULT_DECK_BUTTON_COLOR: DeckButtonColor = "slate"

export function isDeckButtonColor(value: string): value is DeckButtonColor {
  return DECK_BUTTON_COLORS.some((color) => color.value === value)
}

export function normalizeDeckButtonColor(value: string | undefined | null): DeckButtonColor {
  if (!value) {
    return DEFAULT_DECK_BUTTON_COLOR
  }

  if (typeof value !== "string") {
    return DEFAULT_DECK_BUTTON_COLOR
  }

  if (isDeckButtonColor(value)) {
    return value
  }

  const normalizedLegacy = LEGACY_COLOR_MAP[value.toLowerCase()]
  return normalizedLegacy ?? DEFAULT_DECK_BUTTON_COLOR
}

export function getDeckButtonColor(value: string | undefined | null) {
  const normalized = normalizeDeckButtonColor(value)
  return DECK_BUTTON_COLORS.find((color) => color.value === normalized) ?? DECK_BUTTON_COLORS[0]
}
