export const DECK_BUTTON_COLORS = [
  { value: "slate", label: "Slate", bgClass: "bg-slate-500", textClass: "text-white" },
  { value: "gray", label: "Gray", bgClass: "bg-gray-500", textClass: "text-white" },
  { value: "zinc", label: "Zinc", bgClass: "bg-zinc-500", textClass: "text-white" },
  { value: "neutral", label: "Neutral", bgClass: "bg-neutral-500", textClass: "text-white" },
  { value: "stone", label: "Stone", bgClass: "bg-stone-500", textClass: "text-white" },
  { value: "red", label: "Red", bgClass: "bg-red-500", textClass: "text-white" },
  { value: "orange", label: "Orange", bgClass: "bg-orange-500", textClass: "text-white" },
  { value: "amber", label: "Amber", bgClass: "bg-amber-500", textClass: "text-slate-950" },
  { value: "yellow", label: "Yellow", bgClass: "bg-yellow-500", textClass: "text-slate-950" },
  { value: "lime", label: "Lime", bgClass: "bg-lime-500", textClass: "text-slate-950" },
  { value: "green", label: "Green", bgClass: "bg-green-500", textClass: "text-white" },
  { value: "emerald", label: "Emerald", bgClass: "bg-emerald-500", textClass: "text-white" },
  { value: "teal", label: "Teal", bgClass: "bg-teal-500", textClass: "text-white" },
  { value: "cyan", label: "Cyan", bgClass: "bg-cyan-500", textClass: "text-slate-950" },
  { value: "sky", label: "Sky", bgClass: "bg-sky-500", textClass: "text-white" },
  { value: "blue", label: "Blue", bgClass: "bg-blue-500", textClass: "text-white" },
  { value: "indigo", label: "Indigo", bgClass: "bg-indigo-500", textClass: "text-white" },
  { value: "violet", label: "Violet", bgClass: "bg-violet-500", textClass: "text-white" },
  { value: "purple", label: "Purple", bgClass: "bg-purple-500", textClass: "text-white" },
  { value: "fuchsia", label: "Fuchsia", bgClass: "bg-fuchsia-500", textClass: "text-white" },
  { value: "pink", label: "Pink", bgClass: "bg-pink-500", textClass: "text-white" },
  { value: "rose", label: "Rose", bgClass: "bg-rose-500", textClass: "text-white" },
] as const

export type DeckButtonColor = (typeof DECK_BUTTON_COLORS)[number]["value"]

const LEGACY_COLOR_MAP: Record<string, DeckButtonColor> = {
  "#dc2626": "red",
  "#0f766e": "teal",
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
