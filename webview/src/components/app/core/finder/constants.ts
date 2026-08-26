import type { SearchBy, SearchMatch } from './model/types';

export const DEFAULT_SEARCH_BY: SearchBy = 'name';
export const DEFAULT_MATCH_TYPE: SearchMatch = 'contains';

export const REGEX_ESCAPE_PATTERN = /[.*+?^${}()|[\]\\]/g;

export function escapeRegExp(string: string): string {
  return string.replace(REGEX_ESCAPE_PATTERN, '\\$&');
}

export interface BuildSearchRegexOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
}

export function buildSearchRegex(
  query: string,
  options: BuildSearchRegexOptions = {}
): RegExp | null {
  if (!query.trim()) return null;

  let pattern = options.useRegex ? query : escapeRegExp(query);
  if (options.wholeWord) {
    pattern = `\\b${pattern}\\b`;
  }

  try {
    return new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
  } catch {
    return null;
  }
}
