export const CATEGORY_LABELS = [
  "All Categories",
  "Dumbbells",
  "Kettlebells",
  "Weight Plates",
  "Barbells",
  "Adjustable Dumbbells",
  "Resistance & Bands",
  "Medicine Balls",
  "Mats & Accessories",
] as const;

export type CategoryLabel = (typeof CATEGORY_LABELS)[number];

export function toSlug(label: string): string {
  if (/^all categories$/i.test(label)) return ""; // represent "All" as absent
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function fromSlug(slug: string | null): CategoryLabel {
  if (!slug) return "All Categories";
  const match = CATEGORY_LABELS.find((l) => toSlug(l) === slug.toLowerCase());
  return match ?? "All Categories";
}