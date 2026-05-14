export interface PrimaryCategory {
  handle: string;
  label: string;
}

export const PRIMARY_CATEGORIES: PrimaryCategory[] = [
  { handle: 'vitamines-1', label: 'Vitamines' },
  { handle: 'mineralen-1', label: 'Mineralen' },
  { handle: 'eiwitten-aminozuren-1', label: 'Eiwitten' },
  { handle: 'kruiden-planten-2', label: 'Kruiden & Planten' },
  { handle: 'fysiotherapie-herstel-1', label: 'Fysiotherapie' },
];

const HANDLE_TO_LABEL = new Map(PRIMARY_CATEGORIES.map((c) => [c.handle, c.label]));

export function getPrimaryCategoryLabel(handle: string): string | null {
  return HANDLE_TO_LABEL.get(handle) ?? null;
}

export function findPrimaryCategory(
  productCollections: { handle: string; title: string }[],
): PrimaryCategory | null {
  for (const cat of PRIMARY_CATEGORIES) {
    if (productCollections.some((c) => c.handle === cat.handle)) {
      return cat;
    }
  }
  return null;
}
