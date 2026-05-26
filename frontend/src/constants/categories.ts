export const CATEGORIES = [
  { value: "sports", label: "Спорт" },
  { value: "politics", label: "Політика" },
  { value: "technology", label: "Технології" },
  { value: "crypto", label: "Криптовалюта" },
  { value: "space", label: "Космос" },
] as const;

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
);

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);

export function categoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug;
}
