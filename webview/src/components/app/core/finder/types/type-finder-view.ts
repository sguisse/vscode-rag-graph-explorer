export const FINDER_VIEW_LIST = ['toolbar', 'bubble'] as const;
export type FinderView = (typeof FINDER_VIEW_LIST)[number];

export function isFinderView(value: unknown): value is FinderView {
  return typeof value === 'string' && FINDER_VIEW_LIST.includes(value as FinderView);
}
