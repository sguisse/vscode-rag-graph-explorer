import { useMemo } from 'react';
import { buildSearchRegex } from '../constants';

export interface UseFinderCommonOptions {
  searchQuery: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
}

export function useFinderCommon(options: UseFinderCommonOptions) {
  const { searchQuery, caseSensitive, wholeWord, useRegex } = options;

  const activeRegex = useMemo(() => {
    return buildSearchRegex(searchQuery, { caseSensitive, wholeWord, useRegex });
  }, [searchQuery, caseSensitive, wholeWord, useRegex]);

  return { activeRegex };
}
