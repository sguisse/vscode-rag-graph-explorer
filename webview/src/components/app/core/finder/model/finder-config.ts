import type { SearchBy, SearchMatch, FinderView } from '../types';
import { DEFAULT_SEARCH_BY, DEFAULT_MATCH_TYPE } from '../constants';

export interface FinderConfig {
  query: string;
  searchBy: SearchBy;
  matchType: SearchMatch;
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  showHierarchy: boolean;
  collapseNotMatchingNodes: boolean;
  view: FinderView;
}

export const DEFAULT_FINDER_CONFIG: FinderConfig = {
  query: '',
  searchBy: DEFAULT_SEARCH_BY,
  matchType: DEFAULT_MATCH_TYPE,
  caseSensitive: false,
  wholeWord: false,
  useRegex: false,
  showHierarchy: true,
  collapseNotMatchingNodes: false,
  view: 'toolbar',
};
