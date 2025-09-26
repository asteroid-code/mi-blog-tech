// lib/utils/categories.ts
export function normalizeCategories(categories: any): Array<{id: string, name: string, slug?: string}> {
  if (!categories) return [];
  if (Array.isArray(categories)) return categories;
  if (categories && typeof categories === 'object' && categories.name) return [categories];
  return [];
}

export function getCategoryName(categories: any): string {
  const normalized = normalizeCategories(categories);
  return normalized.length > 0 ? normalized[0].name : 'General';
}
