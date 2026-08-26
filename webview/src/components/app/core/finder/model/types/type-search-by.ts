export const SEARCH_BY_LIST = ['name', 'tags', 'both'] as const;
export type SearchBy = (typeof SEARCH_BY_LIST)[number];

export function isSearchBy(value: unknown): value is SearchBy {
  return typeof value === 'string' && SEARCH_BY_LIST.includes(value as SearchBy);
}
