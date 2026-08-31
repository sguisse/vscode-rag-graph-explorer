export const SEARCH_MATCH_LIST = ['contains', 'start-with', 'end-with'] as const;
export type SearchMatch = (typeof SEARCH_MATCH_LIST)[number];

export function isSearchMatch(value: unknown): value is SearchMatch {
  return typeof value === 'string' && SEARCH_MATCH_LIST.includes(value as SearchMatch);
}
