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

export interface CategoryColors {
  fg: string;
  bg: string;
  border: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColors> = {
  sports: {
    fg: "var(--cat-sports)",
    bg: "var(--cat-sports-bg)",
    border: "var(--cat-sports-border)",
  },
  politics: {
    fg: "var(--cat-politics)",
    bg: "var(--cat-politics-bg)",
    border: "var(--cat-politics-border)",
  },
  technology: {
    fg: "var(--cat-tech)",
    bg: "var(--cat-tech-bg)",
    border: "var(--cat-tech-border)",
  },
  crypto: {
    fg: "var(--cat-crypto)",
    bg: "var(--cat-crypto-bg)",
    border: "var(--cat-crypto-border)",
  },
  space: {
    fg: "var(--cat-space)",
    bg: "var(--cat-space-bg)",
    border: "var(--cat-space-border)",
  },
};

export function categoryColors(slug: string): CategoryColors {
  return (
    CATEGORY_COLORS[slug] ?? {
      fg: "var(--text-secondary)",
      bg: "rgba(156, 163, 175, 0.20)",
      border: "rgba(156, 163, 175, 0.30)",
    }
  );
}
